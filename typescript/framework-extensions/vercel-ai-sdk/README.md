# AgentKit Extension - Vercel AI SDK Toolkit

CDP integration with Vercel AI SDK to enable agentic workflows using the core primitives defined in `cdp-agentkit-core`.

This toolkit contains tools that enable an LLM agent to interact with the [Coinbase Developer Platform](https://docs.cdp.coinbase.com/) through Vercel AI SDK. The toolkit provides a wrapper around the CDP SDK, allowing agents to perform onchain operations like transfers, trades, and smart contract interactions.

## Setup

### Prerequisites

- [CDP API Key](https://portal.cdp.coinbase.com/access/api)
- Node.js 18 or higher

### Installation

```bash
npm install @coinbase/cdp-vercel-ai-sdk
```

### Environment Setup

Set the following environment variables:

```bash
export CDP_API_KEY_NAME=<your-api-key-name>
export CDP_API_KEY_PRIVATE_KEY=$'<your-private-key>'
export NETWORK_ID=base-sepolia  # Optional: Defaults to base-sepolia
```

## Usage

### Basic Setup

```typescript
import { getVercelAITools } from "@coinbase/cdp-vercel-ai-sdk";
import { CdpAgentkit } from "@coinbase/cdp-agentkit-core";

// Initialize CDP AgentKit
const agentkit = await CdpAgentkit.configureWithWallet();

// Get available tools
const tools = await getVercelAITools(agentkit);
```

The toolkit provides access to all CDP AgentKit tools in a Vercel AI SDK compatible format.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for detailed setup instructions and contribution guidelines. 