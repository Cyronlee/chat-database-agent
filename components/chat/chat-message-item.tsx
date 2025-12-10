"use client"

import {
  MessageBranch,
  MessageBranchContent,
  MessageBranchNext,
  MessageBranchPage,
  MessageBranchPrevious,
  MessageBranchSelector,
} from "@/components/ai-elements/message"
import { Message, MessageContent } from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import { MessageResponse } from "@/components/ai-elements/message"
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources"
import { cn } from "@/lib/utils"
import type { MessageType } from "./types"

type ChatMessageItemProps = {
  message: Omit<MessageType, "versions">
  versions: MessageType["versions"]
}

export function ChatMessageItem({ message, versions }: ChatMessageItemProps) {
  return (
    <MessageBranch defaultBranch={0} key={message.key}>
      <MessageBranchContent>
        {versions.map((version) => (
          <Message from={message.from} key={`${message.key}-${version.id}`}>
            <div>
              {message.sources?.length && (
                <Sources>
                  <SourcesTrigger count={message.sources.length} />
                  <SourcesContent>
                    {message.sources.map((source) => (
                      <Source
                        href={source.href}
                        key={source.href}
                        title={source.title}
                      />
                    ))}
                  </SourcesContent>
                </Sources>
              )}
              {message.reasoning && (
                <Reasoning
                  duration={message.reasoning.duration}
                  isStreaming={message.isReasoningStreaming}
                >
                  <ReasoningTrigger />
                  <ReasoningContent>{message.reasoning.content}</ReasoningContent>
                </Reasoning>
              )}
              {(message.from === "user" ||
                message.isReasoningComplete ||
                !message.reasoning) && (
                <MessageContent
                  className={cn(
                    "group-[.is-user]:rounded-[24px] group-[.is-user]:rounded-br-sm group-[.is-user]:border group-[.is-user]:bg-background group-[.is-user]:text-foreground",
                    "group-[.is-assistant]:bg-transparent group-[.is-assistant]:p-0 group-[.is-assistant]:text-foreground"
                  )}
                >
                  <MessageResponse>{version.content}</MessageResponse>
                </MessageContent>
              )}
            </div>
          </Message>
        ))}
      </MessageBranchContent>
      {versions.length > 1 && (
        <MessageBranchSelector className="px-0" from={message.from}>
          <MessageBranchPrevious />
          <MessageBranchPage />
          <MessageBranchNext />
        </MessageBranchSelector>
      )}
    </MessageBranch>
  )
}

