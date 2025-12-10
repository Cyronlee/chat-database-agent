"use client"

import type { UIMessage } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { ChatMessageItem } from "./chat-message-item"

type ChatMessageListProps = {
  messages: UIMessage[]
  onToolApproval: (
    toolCallId: string,
    toolName: string,
    approved: boolean
  ) => void
  toolsRequiringConfirmation: string[]
}

export function ChatMessageList({
  messages,
  onToolApproval,
  toolsRequiringConfirmation,
}: ChatMessageListProps) {
  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            onToolApproval={onToolApproval}
            toolsRequiringConfirmation={toolsRequiringConfirmation}
          />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
