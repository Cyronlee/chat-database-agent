"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState } from "react"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { toast } from "sonner"

const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const

// All current tools auto-execute, so no confirmation is required
const toolsRequiringConfirmation: string[] = []

export function ChatWindow() {
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true)

  const { messages, sendMessage, status, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    sendMessage({ text: message.text || "Sent with attachments" })
  }

  const handleToolApproval = async (
    toolCallId: string,
    toolName: string,
    approved: boolean
  ) => {
    await addToolOutput({
      toolCallId,
      tool: toolName,
      output: approved ? APPROVAL.YES : APPROVAL.NO,
    })
    sendMessage()
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-secondary">
      <ChatMessageList
        messages={messages}
        onToolApproval={handleToolApproval}
        toolsRequiringConfirmation={toolsRequiringConfirmation}
      />
      <ChatInput
        onSubmit={handleSubmit}
        disabled={status === "streaming"}
        isThinkingEnabled={isThinkingEnabled}
        onThinkingToggle={setIsThinkingEnabled}
      />
    </div>
  )
}
