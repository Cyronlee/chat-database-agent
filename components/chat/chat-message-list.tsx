"use client"

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import { ChatMessageItem } from "./chat-message-item"
import type { MessageType } from "./types"

type ChatMessageListProps = {
  messages: MessageType[]
}

export function ChatMessageList({ messages }: ChatMessageListProps) {
  return (
    <Conversation className="min-h-0 flex-1">
      <ConversationContent className="pb-4">
        {messages.map(({ versions, ...message }) => (
          <ChatMessageItem
            key={message.key}
            message={message}
            versions={versions}
          />
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  )
}

