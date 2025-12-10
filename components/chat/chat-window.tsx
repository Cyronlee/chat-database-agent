"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, isToolUIPart, getToolName } from "ai"
import { useState } from "react"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { getToolsRequiringConfirmation } from "@/app/api/chat/tools"
import { toast } from "sonner"

const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const

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

  const toolsRequiringConfirmation = getToolsRequiringConfirmation()

  // Check if there's a pending tool call confirmation
  const pendingToolCallConfirmation = messages.some((m) =>
    m.parts?.some(
      (part) =>
        isToolUIPart(part) &&
        part.state === "input-available" &&
        toolsRequiringConfirmation.includes(getToolName(part))
    )
  )

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
        disabled={pendingToolCallConfirmation || status === "streaming"}
        isThinkingEnabled={isThinkingEnabled}
        onThinkingToggle={setIsThinkingEnabled}
      />
    </div>
  )
}
