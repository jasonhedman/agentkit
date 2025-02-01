import { z } from "zod";
import { getVercelAITools } from "./index";
import { AgentKit, Action } from "@coinbase/cdp-agentkit-core";

// Mocking the Action class
const mockAction: Action = {
  name: "testAction",
  description: "A test action",
  schema: z.object({ test: z.string() }),
  invoke: jest.fn(async arg => `Invoked with ${arg.test}`),
};

// Creating a mock for AgentKit
jest.mock("@coinbase/cdp-agentkit-core", () => {
  const originalModule = jest.requireActual("@coinbase/cdp-agentkit-core");
  return {
    ...originalModule,
    AgentKit: {
      from: jest.fn().mockImplementation(() => ({
        getActions: jest.fn(() => [mockAction]),
      })),
    },
  };
});

describe("getVercelAITools", () => {
  it("should return a record of tools with correct properties", async () => {
    const mockAgentKit = await AgentKit.from({});
    const tools = await getVercelAITools(mockAgentKit);

    expect(tools).toHaveProperty("testAction");
    const tool = tools.testAction;

    expect((tool as { description?: string }).description).toBe(mockAction.description);
    expect(tool.parameters).toBe(mockAction.schema);

    // Test execution with required options
    const result = await tool.execute!({ test: "data" }, { 
      abortSignal: new AbortController().signal,
      toolCallId: "test-call",
      messages: []
    });
    expect(result).toBe("Invoked with data");
  });
});
