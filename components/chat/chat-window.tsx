"use client"

import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { useChatMessages } from "./use-chat-messages"

export function ChatWindow() {
  const { setStatus, messages, addUserMessage } = useChatMessages()

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    setStatus("submitted")
    addUserMessage(message.text || "Sent with attachments")
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-secondary">
      <ChatMessageList messages={messages} />
      <ChatInput onSubmit={handleSubmit} />
    </div>
  )
}
