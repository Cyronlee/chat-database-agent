import { google } from "@ai-sdk/google"
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  convertToModelMessages,
  stepCountIs,
} from "ai"
import type { UIMessage } from "ai"
import { createQueryDatabaseTool } from "@/tools/database-query"
import { buildSystemPrompt } from "@/lib/agent-prompt"
import { dbManager } from "@/lib/db-manager"

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    messages,
    model = "gemini-2.5-flash",
    thinking = true,
    databaseId,
  }: {
    messages: UIMessage[]
    model?: string
    thinking?: boolean
    databaseId?: string | null
  } = await req.json()

  // Dynamically get schema for the selected database
  const schema = databaseId
    ? await dbManager.getSchema(databaseId)
    : await dbManager.getSystemSchema()

  // Build system prompt with dynamic schema
  const systemPrompt = buildSystemPrompt(schema)

  // Create query tool with the selected database
  const queryDatabase = createQueryDatabaseTool(databaseId || null)

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const result = streamText({
        model: google(model),
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        tools: { queryDatabase },
        stopWhen: stepCountIs(20),
        providerOptions: {
          google: {
            thinkingConfig: {
              thinkingBudget: 4096,
              includeThoughts: thinking,
            },
          } satisfies GoogleGenerativeAIProviderOptions,
        },
      })

      writer.merge(result.toUIMessageStream({ originalMessages: messages }))
    },
  })

  return createUIMessageStreamResponse({ stream })
}
