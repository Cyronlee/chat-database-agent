import { google } from "@ai-sdk/google"
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
  isToolUIPart,
  getToolName,
  stepCountIs,
} from "ai"
import type { UIMessage } from "ai"
import {
  tools,
  executeWeatherTool,
  executeSearchTool,
} from "./tools"

// Approval states
const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      // Process tool calls that require human confirmation
      const lastMessage = messages[messages.length - 1]

      if (lastMessage?.parts) {
        lastMessage.parts = await Promise.all(
          lastMessage.parts.map(async (part) => {
            if (!isToolUIPart(part)) {
              return part
            }

            const toolName = getToolName(part)

            // Only process if tool has output available (user responded)
            if (part.state !== "output-available") {
              return part
            }

            // Handle weather tool confirmation
            if (toolName === "getWeatherInformation") {
              if (part.output === APPROVAL.YES) {
                const result = await executeWeatherTool(
                  part.input as { city: string; units: "celsius" | "fahrenheit" }
                )
                writer.write({
                  type: "tool-output-available",
                  toolCallId: part.toolCallId,
                  output: result,
                })
                return { ...part, output: result }
              } else if (part.output === APPROVAL.NO) {
                const result = "Error: User denied access to weather information"
                writer.write({
                  type: "tool-output-available",
                  toolCallId: part.toolCallId,
                  output: result,
                })
                return { ...part, output: result }
              }
            }

            // Handle search tool confirmation
            if (toolName === "searchDatabase") {
              if (part.output === APPROVAL.YES) {
                const result = await executeSearchTool(
                  part.input as { query: string; limit: number }
                )
                writer.write({
                  type: "tool-output-available",
                  toolCallId: part.toolCallId,
                  output: result,
                })
                return { ...part, output: result }
              } else if (part.output === APPROVAL.NO) {
                const result = "Error: User denied access to search"
                writer.write({
                  type: "tool-output-available",
                  toolCallId: part.toolCallId,
                  output: result,
                })
                return { ...part, output: result }
              }
            }

            return part
          })
        )
      }

      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: `You are a helpful AI assistant. You have access to the following tools:
- getWeatherInformation: Get current weather for a city (requires user approval)
- getCurrentTime: Get the current time for a timezone (auto-executes)
- searchDatabase: Search the database for information (requires user approval)

When a user asks about weather or wants to search, use the appropriate tool.`,
        messages: convertToModelMessages(messages),
        tools,
        stopWhen: stepCountIs(5),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 4096,
              includeThoughts: true,
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
      })

      writer.merge(result.toUIMessageStream({ originalMessages: messages }))
    },
  })

  return createUIMessageStreamResponse({ stream })
}

