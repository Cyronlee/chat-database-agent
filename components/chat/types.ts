import type { ToolUIPart } from "ai"

export type MessageType = {
  key: string
  from: "user" | "assistant"
  sources?: { href: string; title: string }[]
  versions: {
    id: string
    content: string
  }[]
  reasoning?: {
    content: string
    duration: number
  }
  tools?: {
    name: string
    description: string
    status: ToolUIPart["state"]
    parameters: Record<string, unknown>
    result: string | undefined
    error: string | undefined
  }[]
  isReasoningComplete?: boolean
  isContentComplete?: boolean
  isReasoningStreaming?: boolean
}

export type ModelType = {
  id: string
  name: string
  chef: string
  chefSlug: string
  providers: string[]
}

export type ChatStatus = "submitted" | "streaming" | "ready" | "error"
