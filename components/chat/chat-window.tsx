"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useMemo, useState } from "react"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { toast } from "sonner"
import { models } from "./constants"
import { useDatabaseStore } from "@/stores/database-store"

const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const

// All current tools auto-execute, so no confirmation is required
const toolsRequiringConfirmation: string[] = []

export function ChatWindow() {
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(false)
  const [model, setModel] = useState<string>(models[0].id)
  const { selectedDatabaseId } = useDatabaseStore()

  const { messages, sendMessage, status, addToolOutput, setMessages } = useChat(
    {
      transport: new DefaultChatTransport({
        api: "/api/chat",
      }),
      onError: (error) => {
        toast.error(error.message)
      },
    }
  )

  // Show shimmer when waiting for assistant response to start
  const isWaitingForResponse = useMemo(() => {
    if (status !== "streaming" && status !== "submitted") {
      return false
    }
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) {
      return false
    }
    // Show shimmer if last message is from user
    if (lastMessage.role === "user") {
      return true
    }
    // Show shimmer if assistant message exists but has no parts yet
    if (
      lastMessage.role === "assistant" &&
      (!lastMessage.parts || lastMessage.parts.length === 0)
    ) {
      return true
    }
    return false
  }, [messages, status])

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    sendMessage(
      { text: message.text || "Sent with attachments" },
      {
        body: {
          model,
          thinking: isThinkingEnabled,
          databaseId: selectedDatabaseId,
        },
      }
    )
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
    sendMessage(undefined, {
      body: {
        model,
        thinking: isThinkingEnabled,
        databaseId: selectedDatabaseId,
      },
    })
  }

  const handleClearSession = () => {
    setMessages([])
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-secondary">
      <ChatMessageList
        messages={messages}
        onToolApproval={handleToolApproval}
        toolsRequiringConfirmation={toolsRequiringConfirmation}
        isWaitingForResponse={isWaitingForResponse}
        databaseId={selectedDatabaseId}
      />
      <ChatInput
        onSubmit={handleSubmit}
        disabled={status === "streaming"}
        isThinkingEnabled={isThinkingEnabled}
        onThinkingToggle={setIsThinkingEnabled}
        model={model}
        onModelChange={setModel}
        onClearSession={handleClearSession}
      />
    </div>
  )
}
