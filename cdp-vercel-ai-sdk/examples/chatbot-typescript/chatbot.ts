import { AgentKit, ViemWalletProvider } from "@coinbase/cdp-agentkit-core";
import { getVercelAITools } from "@coinbase/cdp-vercel-ai-sdk";
import { openai } from "@ai-sdk/openai";
import { generateId, generateText, Message, streamText } from "ai";
import * as dotenv from "dotenv";
import * as readline from "readline";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

dotenv.config();

async function initializeAgent() {
  try {
    const account = privateKeyToAccount(
      "0x4c0883a69102937d6231471b5dbb6208ffd70c02a813d7f2da1c54f2e3be9f38"
    );

    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(),
    });

    const walletProvider = new ViemWalletProvider(client);
    const agentKit = await AgentKit.from({ walletProvider });
    const tools = await getVercelAITools(agentKit);

    return { tools };
  } catch (error) {
    console.error("Failed to initialize agent:", error);
    throw error;
  }
}

async function runChatMode(tools: Record<string, any>) {
  console.log("Starting chat mode... Type 'exit' to end.");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> =>
    new Promise(resolve => rl.question(prompt, resolve));

  const messages: Message[] = [];

  try {
    while (true) {
      const userInput = await question("\nPrompt: ");

      if (userInput.toLowerCase() === "exit") {
        break;
      }

      messages.push({ id: generateId(), role: "user", content: userInput });

      const stream = await streamText({
        model: openai("gpt-4-turbo-preview"),
        messages,
        tools,
      });

      let assistantMessage = "";
      for await (const chunk of stream.textStream) {
        const content = chunk;
        process.stdout.write(content);
        assistantMessage += content;
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
