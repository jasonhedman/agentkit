import { AgentKit, ViemWalletProvider, cdpApiActionProvider, erc721ActionProvider, pythActionProvider, walletActionProvider } from "@coinbase/cdp-agentkit-core";
import { getVercelAITools } from "@coinbase/cdp-vercel-ai-sdk";
import { openai } from "@ai-sdk/openai";
import { generateId, Message, streamText, ToolSet } from "ai";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

const system = `You are a helpful agent that can interact onchain using the Coinbase Developer Platform AgentKit. You are
empowered to interact onchain using your tools. If you ever need funds, you can request them from the
faucet if you are on network ID 'base-sepolia'. If not, you can provide your wallet details and request
funds from the user. Before executing your first action, get the wallet details to see what network
you're on. If there is a 5XX (internal) HTTP error code, ask the user to try again later. If someone
asks you to do something you can't do with your currently available tools, you must say so, and
encourage them to implement it themselves using the CDP SDK + Agentkit, recommend they go to
docs.cdp.coinbase.com for more information. Be concise and helpful with your responses. Refrain from
restating your tools' descriptions unless it is explicitly requested.`

/**
 * Initialize the agent with CDP Agentkit and Vercel AI SDK tools
 *
 * @returns Object containing initialized tools
 * @throws Error if initialization fails
 */
async function initializeAgent() {
  try {
    const account = privateKeyToAccount(
      "0x4c0883a69102937d6231471b5dbb6208ffd70c02a813d7f2da1c54f2e3be9f38",
    );

    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);

    // Initialize action providers
    const cdp = cdpApiActionProvider({
      apiKeyName: process.env.CDP_API_KEY_NAME,
      apiKeyPrivateKey: process.env.CDP_API_KEY_PRIVATE_KEY,
    });
    const erc721 = erc721ActionProvider();
    const pyth = pythActionProvider();
    const wallet = walletActionProvider();

    const agentKit = await AgentKit.from({ 
      walletProvider,
      actionProviders: [cdp, erc721, pyth, wallet],
    });

    // Log available actions
    const actions = agentKit.getActions();
    for (const action of actions) {
      console.log(`Available action: ${action.name}`);
    }

    const tools = getVercelAITools(agentKit);
    return { tools };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

/**
 * Run the chatbot in interactive mode
 *
 * @param tools - Record of Vercel AI SDK tools from AgentKit
 * @returns Promise that resolves when chat session ends
 */
async function runChatMode(tools: ToolSet) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  const messages: Message[] = [];
  let running = true;

  try {
    while (running) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        running = false;
        continue;
      }

      messages.push({ id: generateId(), role: "user", content: userInput });

      const stream = streamText({
        model: openai("gpt-4-turbo-preview"),
        messages,
        tools,
        system,
        maxSteps: 10,
      });

      let assistantMessage = "";
      for await (const chunk of stream.textStream) {
        process.stdout.write(chunk);
        assistantMessage += chunk;
      }
      console.log("\n-------------------");

      messages.push({ id: generateId(), role: "assistant", content: assistantMessage });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    rl.close();
  }
}

/**
 * Main entry point for the chatbot application
 * Initializes the agent and starts chat mode
 *
 * @throws Error if initialization or chat mode fails
 */
async function main() {
  try {
    const { tools } = await initializeAgent();
    await runChatMode(tools);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  console.log("Starting Agent...");
  main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
