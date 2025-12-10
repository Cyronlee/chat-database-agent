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
import { cn } from "@/lib/utils"

type ChatMessageItemProps = {
  message: UIMessage
  onToolApproval: (toolCallId: string, toolName: string, approved: boolean) => void
  toolsRequiringConfirmation: string[]
}

export function ChatMessageItem({
  message,
  onToolApproval,
  toolsRequiringConfirmation,
}: ChatMessageItemProps) {
  const { role, parts } = message

  // Extract reasoning parts
  const reasoningParts = parts?.filter(
    (part): part is ReasoningUIPart => part.type === "reasoning"
  ) || []

  // Extract tool parts
  const toolParts = parts?.filter((part): part is ToolUIPart =>
    isToolUIPart(part)
  ) || []

  // Extract text parts
  const textContent = parts
    ?.filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("") || ""

  // Check if reasoning is currently streaming
  const isReasoningStreaming = reasoningParts.some(
    (part) => !part.text || part.text.length === 0
  )

  return (
    <Message from={role}>
      <div className="flex flex-col gap-2">
        {/* Reasoning Section */}
        {reasoningParts.length > 0 && (
          <Reasoning isStreaming={isReasoningStreaming}>
            <ReasoningTrigger />
            <ReasoningContent>
              {reasoningParts.map((part) => part.text).join("\n")}
            </ReasoningContent>
          </Reasoning>
        )}

        {/* Tool Invocations */}
        {toolParts.map((toolPart) => {
          const toolName = getToolName(toolPart)
          const requiresConfirmation = toolsRequiringConfirmation.includes(toolName)
          const isPendingApproval = requiresConfirmation && toolPart.state === "input-available"
          const isCompleted = toolPart.state === "output-available" || toolPart.state === "output-error"
          const wasApproved = requiresConfirmation && isCompleted && toolPart.output !== undefined

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
                      onClick={() => onToolApproval(toolPart.toolCallId, toolName, false)}
                    >
                      <XIcon className="mr-1 size-4" />
                      Reject
                    </ConfirmationAction>
                    <ConfirmationAction
                      variant="default"
                      onClick={() => onToolApproval(toolPart.toolCallId, toolName, true)}
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
                    approved: typeof toolPart.output !== "string" || !String(toolPart.output).includes("denied"),
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
        })}

        {/* Text Content */}
        {textContent && (
                <MessageContent
                  className={cn(
                    "group-[.is-user]:rounded-[24px] group-[.is-user]:rounded-br-sm group-[.is-user]:border group-[.is-user]:bg-background group-[.is-user]:text-foreground",
                    "group-[.is-assistant]:bg-transparent group-[.is-assistant]:p-0 group-[.is-assistant]:text-foreground"
                  )}
                >
            <MessageResponse>{textContent}</MessageResponse>
                </MessageContent>
              )}
            </div>
          </Message>
  )
}
