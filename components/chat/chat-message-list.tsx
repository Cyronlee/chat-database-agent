"use client"

import type { UIMessage } from "ai"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { Message } from "@/components/ai-elements/message"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { ChatMessageItem } from "./chat-message-item"

type ChatMessageListProps = {
  messages: UIMessage[]
  onToolApproval: (
    toolCallId: string,
    toolName: string,
    approved: boolean
  ) => void
  toolsRequiringConfirmation: string[]
  isWaitingForResponse?: boolean
}

export function ChatMessageList({
  messages,
  onToolApproval,
  toolsRequiringConfirmation,
  isWaitingForResponse = false,
}: ChatMessageListProps) {
  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="py-8 max-w-4xl mx-auto">
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            onToolApproval={onToolApproval}
            toolsRequiringConfirmation={toolsRequiringConfirmation}
          />
        ))}
        {isWaitingForResponse && (
          <Shimmer className="text-sm">Agent is processing...</Shimmer>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}
