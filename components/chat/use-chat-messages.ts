"use client"

import { useCallback, useEffect, useState } from "react"
import type { MessageType, ChatStatus } from "./types"
import { mockMessages, mockMessageResponses } from "./constants"

export function useChatMessages() {
  const [status, setStatus] = useState<ChatStatus>("ready")
  const [messages, setMessages] = useState<MessageType[]>([])
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(
    null
  )

  const streamReasoning = async (
    messageKey: string,
    _versionId: string,
    reasoningContent: string
  ) => {
    const words = reasoningContent.split(" ")
    let currentContent = ""

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? " " : "") + words[i]

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === messageKey) {
            return {
              ...msg,
              reasoning: msg.reasoning
                ? { ...msg.reasoning, content: currentContent }
                : undefined,
            }
          }
          return msg
        })
      )

      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 30 + 20)
      )
    }

    // Mark reasoning as complete
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.key === messageKey) {
          return {
            ...msg,
            isReasoningComplete: true,
            isReasoningStreaming: false,
          }
        }
        return msg
      })
    )
  }

  const streamContent = async (
    messageKey: string,
    versionId: string,
    content: string
  ) => {
    const words = content.split(" ")
    let currentContent = ""

    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? " " : "") + words[i]

      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.key === messageKey) {
            return {
              ...msg,
              versions: msg.versions.map((v) =>
                v.id === versionId ? { ...v, content: currentContent } : v
              ),
            }
          }
          return msg
        })
      )

      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 50 + 25)
      )
    }

    // Mark content as complete
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.key === messageKey) {
          return { ...msg, isContentComplete: true }
        }
        return msg
      })
    )
  }

  const streamMessageResponse = useCallback(
    async (
      messageKey: string,
      versionId: string,
      content: string,
      reasoning?: { content: string; duration: number }
    ) => {
      setStatus("streaming")
      setStreamingMessageId(versionId)

      // First stream the reasoning if it exists
      if (reasoning) {
        await streamReasoning(messageKey, versionId, reasoning.content)
        await new Promise((resolve) => setTimeout(resolve, 500)) // Pause between reasoning and content
      }

      // Then stream the content
      await streamContent(messageKey, versionId, content)

      setStatus("ready")
      setStreamingMessageId(null)
    },
    []
  )

  const streamMessage = useCallback(
    async (message: MessageType) => {
      if (message.from === "user") {
        setMessages((prev) => [...prev, message])
        return
      }

      // Add empty assistant message with reasoning structure
      const newMessage = {
        ...message,
        versions: message.versions.map((v) => ({ ...v, content: "" })),
        reasoning: message.reasoning
          ? { ...message.reasoning, content: "" }
          : undefined,
        isReasoningComplete: false,
        isContentComplete: false,
        isReasoningStreaming: !!message.reasoning,
      }

      setMessages((prev) => [...prev, newMessage])

      // Get the first version for streaming
      const firstVersion = message.versions[0]
      if (!firstVersion) return

      // Stream the response
      await streamMessageResponse(
        newMessage.key,
        firstVersion.id,
        firstVersion.content,
        message.reasoning
      )
    },
    [streamMessageResponse]
  )

  const addUserMessage = useCallback(
    (content: string) => {
      const userMessage: MessageType = {
        key: `user-${Date.now()}`,
        from: "user",
        versions: [
          {
            id: `user-${Date.now()}`,
            content,
          },
        ],
      }

      setMessages((prev) => [...prev, userMessage])

      setTimeout(() => {
        const assistantMessageKey = `assistant-${Date.now()}`
        const assistantMessageId = `version-${Date.now()}`
        const randomMessageResponse =
          mockMessageResponses[
            Math.floor(Math.random() * mockMessageResponses.length)
          ]

        // Create reasoning for some responses
        const shouldHaveReasoning = Math.random() > 0.5
        const reasoning = shouldHaveReasoning
          ? {
              content:
                "Let me think about this question carefully. I need to provide a comprehensive and helpful response that addresses the user's needs while being clear and concise.",
              duration: 3,
            }
          : undefined

        const assistantMessage: MessageType = {
          key: assistantMessageKey,
          from: "assistant",
          versions: [
            {
              id: assistantMessageId,
              content: "",
            },
          ],
          reasoning: reasoning ? { ...reasoning, content: "" } : undefined,
          isReasoningComplete: false,
          isContentComplete: false,
          isReasoningStreaming: !!reasoning,
        }

        setMessages((prev) => [...prev, assistantMessage])
        streamMessageResponse(
          assistantMessageKey,
          assistantMessageId,
          randomMessageResponse,
          reasoning
        )
      }, 500)
    },
    [streamMessageResponse]
  )

  useEffect(() => {
    // Reset state on mount to ensure fresh component
    setMessages([])

    const processMessages = async () => {
      for (let i = 0; i < mockMessages.length; i++) {
        await streamMessage(mockMessages[i])

        if (i < mockMessages.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    // Small delay to ensure state is reset before starting
    const timer = setTimeout(() => {
      processMessages()
    }, 100)

    // Cleanup function to cancel any ongoing operations
    return () => {
      clearTimeout(timer)
      setMessages([])
    }
  }, [streamMessage])

  return {
    status,
    setStatus,
    messages,
    streamingMessageId,
    addUserMessage,
  }
}

