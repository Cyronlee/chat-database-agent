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
import { queryDatabase } from "@/tools/database-query"
import { SYSTEM_PROMPT } from "@/agent/chat-database-agent"

export const maxDuration = 60

export async function POST(req: Request) {
  const {
    messages,
    model = "gemini-2.5-flash",
    thinking = true,
  }: {
    messages: UIMessage[]
    model?: string
    thinking?: boolean
  } = await req.json()

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const result = streamText({
        model: google(model),
        system: SYSTEM_PROMPT,
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
