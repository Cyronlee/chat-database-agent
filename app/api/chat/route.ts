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

export const maxDuration = 60

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: async ({ writer }) => {
      const result = streamText({
        model: google("gemini-2.5-flash"),
        system: `You are a helpful AI assistant specialized in Jira data analysis. You have access to the following tools:
- queryDatabase: Execute SQL queries against the Jira database to retrieve and analyze data

When a user asks about Jira projects, issues, sprints, users, or any other Jira-related data, use the queryDatabase tool to fetch the relevant information.

Guidelines:
- Always use SELECT queries only
- Use JOINs to combine related tables when needed
- Limit results appropriately to avoid overwhelming responses
- Format and summarize the query results in a clear, readable way`,
        messages: convertToModelMessages(messages),
        tools: { queryDatabase },
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
