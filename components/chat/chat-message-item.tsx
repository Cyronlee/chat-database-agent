"use client"

import type { UIMessage, ReasoningUIPart, ToolUIPart } from "ai"
import { isToolUIPart, getToolName } from "ai"
import { CheckIcon, XIcon } from "lucide-react"
import { Message, MessageContent } from "@/components/ai-elements/message"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import {
  Confirmation,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation"
import {
  SqlBlock,
  extractSqlBlocks,
  hasSqlBlocks,
} from "@/components/ai-elements/sql-block"
import { cn } from "@/lib/utils"

type ChatMessageItemProps = {
  message: UIMessage
  onToolApproval: (
    toolCallId: string,
    toolName: string,
    approved: boolean
  ) => void
  toolsRequiringConfirmation: string[]
}

export function ChatMessageItem({
  message,
  onToolApproval,
  toolsRequiringConfirmation,
}: ChatMessageItemProps) {
  const { role, parts } = message

  // Collect text parts to potentially merge consecutive text parts
  const mergedParts: Array<
    ReasoningUIPart | ToolUIPart | { type: "text"; text: string; index: number }
  > = []
  let currentText = ""
  let textStartIndex = -1

  parts?.forEach((part, index) => {
    if (part.type === "text") {
      if (textStartIndex === -1) {
        textStartIndex = index
      }
      currentText += (part as { type: "text"; text: string }).text
    } else {
      // If we have accumulated text, add it as a merged part
      if (currentText) {
        mergedParts.push({
          type: "text",
          text: currentText,
          index: textStartIndex,
        })
        currentText = ""
        textStartIndex = -1
      }
      // Add the non-text part
      if (part.type === "reasoning") {
        mergedParts.push(part as ReasoningUIPart)
      } else if (isToolUIPart(part)) {
        mergedParts.push(part as ToolUIPart)
      }
    }
  })

  // Don't forget remaining text
  if (currentText) {
    mergedParts.push({ type: "text", text: currentText, index: textStartIndex })
  }

  return (
    <Message from={role}>
      <div className="flex flex-col gap-2">
        {mergedParts.map((part, index) => {
          // Render Reasoning
          if (part.type === "reasoning") {
            const reasoningPart = part as ReasoningUIPart
            const isReasoningStreaming =
              !reasoningPart.text || reasoningPart.text.length === 0
            return (
              <Reasoning
                key={`reasoning-${index}`}
                isStreaming={isReasoningStreaming}
              >
                <ReasoningTrigger />
                <ReasoningContent>{reasoningPart.text}</ReasoningContent>
              </Reasoning>
            )
          }

          // Render Tool
          if (isToolUIPart(part)) {
            const toolPart = part as ToolUIPart
            const toolName = getToolName(toolPart)
            const requiresConfirmation =
              toolsRequiringConfirmation.includes(toolName)
            const isPendingApproval =
              requiresConfirmation && toolPart.state === "input-available"
            const isCompleted =
              toolPart.state === "output-available" ||
              toolPart.state === "output-error"
            const wasApproved =
              requiresConfirmation &&
              isCompleted &&
              toolPart.output !== undefined

            return (
              <div key={toolPart.toolCallId} className="space-y-2">
                <Tool defaultOpen={isCompleted}>
                  <ToolHeader type={toolPart.type} state={toolPart.state} />
                  <ToolContent>
                    <ToolInput input={toolPart.input} />
                    {isCompleted && (
                      <ToolOutput
                        output={
                          typeof toolPart.output === "object" ? (
                            <MessageResponse>
                              {JSON.stringify(toolPart.output, null, 2)}
                            </MessageResponse>
                          ) : (
                            String(toolPart.output ?? "")
                          )
                        }
                        errorText={toolPart.errorText}
                      />
                    )}
                  </ToolContent>
                </Tool>

                {/* Human-in-the-loop Confirmation for tools that require approval */}
                {isPendingApproval ? (
                  <Confirmation
                    approval={{ id: toolPart.toolCallId }}
                    state={"approval-requested" as ToolUIPart["state"]}
                  >
                    <ConfirmationRequest>
                      <div className="text-sm">
                        <strong>{toolName}</strong> wants to execute with:
                        <pre className="mt-2 rounded bg-muted p-2 text-xs">
                          {JSON.stringify(toolPart.input, null, 2)}
                        </pre>
                        <p className="mt-2">Do you approve this action?</p>
                      </div>
                    </ConfirmationRequest>
                    <ConfirmationActions>
                      <ConfirmationAction
                        variant="outline"
                        onClick={() =>
                          onToolApproval(toolPart.toolCallId, toolName, false)
                        }
                      >
                        <XIcon className="mr-1 size-4" />
                        Reject
                      </ConfirmationAction>
                      <ConfirmationAction
                        variant="default"
                        onClick={() =>
                          onToolApproval(toolPart.toolCallId, toolName, true)
                        }
                      >
                        <CheckIcon className="mr-1 size-4" />
                        Approve
                      </ConfirmationAction>
                    </ConfirmationActions>
                  </Confirmation>
                ) : null}

                {/* Show approval status after user responds */}
                {wasApproved ? (
                  <Confirmation
                    approval={{
                      id: toolPart.toolCallId,
                      approved:
                        typeof toolPart.output !== "string" ||
                        !String(toolPart.output).includes("denied"),
                    }}
                    state={toolPart.state}
                  >
                    <ConfirmationAccepted>
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckIcon className="size-4" />
                        <span>You approved this tool execution</span>
                      </div>
                    </ConfirmationAccepted>
                    <ConfirmationRejected>
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <XIcon className="size-4" />
                        <span>You rejected this tool execution</span>
                      </div>
                    </ConfirmationRejected>
                  </Confirmation>
                ) : null}
              </div>
            )
          }

          // Render Text
          if (part.type === "text") {
            const textPart = part as {
              type: "text"
              text: string
              index: number
            }
            return (
              <TextContentWithSqlBlocks
                key={`text-${textPart.index}`}
                content={textPart.text}
                isUser={role === "user"}
              />
            )
          }

          return null
        })}
      </div>
    </Message>
  )
}

/**
 * Component that renders text content and handles SQL blocks
 */
function TextContentWithSqlBlocks({
  content,
}: {
  content: string
  isUser: boolean
}) {
  // For assistant messages, check for SQL blocks
  if (!hasSqlBlocks(content)) {
    return (
      <MessageContent
        className={cn(
          "group-[.is-user]:rounded-[24px] group-[.is-user]:rounded-br-sm group-[.is-user]:border group-[.is-user]:bg-background group-[.is-user]:text-foreground",
          "group-[.is-assistant]:bg-transparent group-[.is-assistant]:p-0 group-[.is-assistant]:text-foreground"
        )}
      >
        <MessageResponse>{content}</MessageResponse>
      </MessageContent>
    )
  }

  // Parse and render content with SQL blocks
  const { processedContent, sqlBlocks } = extractSqlBlocks(content)

  // Split the processed content by SQL block placeholders
  const parts = processedContent.split(/__SQL_BLOCK_(\d+)__/)

  return (
    <div className="flex flex-col gap-2">
      {parts.map((part, index) => {
        // Even indices are text content, odd indices are SQL block indices
        if (index % 2 === 0) {
          if (!part.trim()) return null
          return (
            <MessageContent
              key={index}
              className={cn(
                "group-[.is-user]:rounded-[24px] group-[.is-user]:rounded-br-sm group-[.is-user]:border group-[.is-user]:bg-background group-[.is-user]:text-foreground",
                "group-[.is-assistant]:bg-transparent group-[.is-assistant]:p-0 group-[.is-assistant]:text-foreground"
              )}
            >
              <MessageResponse>{part}</MessageResponse>
            </MessageContent>
          )
        } else {
          const sqlIndex = parseInt(part, 10)
          const sql = sqlBlocks[sqlIndex]
          if (!sql) return null
          return <SqlBlock key={index} sql={sql} autoExecute />
        }
      })}
    </div>
  )
}
