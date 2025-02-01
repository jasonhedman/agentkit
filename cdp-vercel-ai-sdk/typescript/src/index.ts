/**
 * Main exports for the CDP Vercel AI SDK package
 */

import { z } from "zod";
import { AgentKit, type Action } from "@coinbase/cdp-agentkit-core";
import { tool, type Tool } from "ai";

/**
 * Get Vercel AI SDK tools from an AgentKit instance
 *
 * @param agentKit - The AgentKit instance
 * @returns An array of Vercel AI SDK tools
 */
export async function getVercelAITools(agentKit: AgentKit): Promise<Record<string, Tool>> {
  const actions: Action[] = agentKit.getActions();
  return actions.reduce((acc, action) => {
    acc[action.name] = tool({
      description: action.description,
      parameters: action.schema,
      execute: async (args: z.output<typeof action.schema>) => {
        const result = await action.invoke(args);
        return result;
      },
    });
    return acc;
  }, {});
}