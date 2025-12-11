"use client"

import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CameraIcon,
  ChevronDownIcon,
  FileIcon,
  ImageIcon,
  LightbulbIcon,
  PaperclipIcon,
  ScreenShareIcon,
  SearchIcon,
  SendIcon,
  SquareIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ChatModelSelector } from "./chat-model-selector"
import { models } from "./constants"
import { cn } from "@/lib/utils"

type ChatInputProps = {
  onSubmit: (message: PromptInputMessage) => void
  disabled?: boolean
  isLoading?: boolean
  onStop?: () => void
  isThinkingEnabled?: boolean
  onThinkingToggle?: (enabled: boolean) => void
  model?: string
  onModelChange?: (model: string) => void
  onClearSession?: () => void
}

export function ChatInput({
  onSubmit,
  disabled = false,
  isLoading = false,
  onStop,
  isThinkingEnabled = true,
  onThinkingToggle,
  model = models[0].id,
  onModelChange,
  onClearSession,
}: ChatInputProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)
  const [text, setText] = useState<string>("")
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false)

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)

    if (!(hasText || hasAttachments)) {
      return
    }

    onSubmit(message)
    setText("")
  }

  const handleFileAction = (action: string) => {
    toast.success("File action", {
      description: action,
    })
  }

  return (
    <div className="grid shrink-0 gap-4 bg-secondary pt-0 pb-4">
      <PromptInput
        className="divide-y-0 rounded-[28px] max-w-4xl mx-auto"
        onSubmit={handleSubmit}
      >
        <PromptInputTextarea
          className="px-5 md:text-base"
          onChange={(event) => setText(event.target.value)}
          placeholder="How can I help?"
          value={text}
          disabled={disabled}
        />
        <PromptInputFooter className="p-2.5">
          <PromptInputTools>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <PromptInputButton
                  className="!rounded-full border text-foreground hidden"
                  variant="outline"
                  disabled={disabled}
                >
                  <PaperclipIcon size={16} />
                  <span className="sr-only">Attach</span>
                </PromptInputButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem
                  onClick={() => handleFileAction("upload-file")}
                >
                  <FileIcon className="mr-2" size={16} />
                  Upload file
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction("upload-photo")}
                >
                  <ImageIcon className="mr-2" size={16} />
                  Upload photo
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction("take-screenshot")}
                >
                  <ScreenShareIcon className="mr-2" size={16} />
                  Take screenshot
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFileAction("take-photo")}
                >
                  <CameraIcon className="mr-2" size={16} />
                  Take photo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center rounded-full border hidden">
              <PromptInputButton
                className="!rounded-l-full text-foreground"
                onClick={() => setUseWebSearch(!useWebSearch)}
                variant="ghost"
                disabled={disabled}
              >
                <SearchIcon size={16} />
                <span>DeepSearch</span>
              </PromptInputButton>
              <div className="h-full w-px bg-border" />
              <PromptInputButton
                className="rounded-r-full"
                size="icon-sm"
                variant="ghost"
                disabled={disabled}
              >
                <ChevronDownIcon size={16} />
              </PromptInputButton>
            </div>
            <PromptInputButton
              className={cn(
                "!rounded-full text-foreground",
                isThinkingEnabled && "bg-primary/10 border-primary"
              )}
              variant="outline"
              onClick={() => onThinkingToggle?.(!isThinkingEnabled)}
              disabled={disabled}
            >
              <LightbulbIcon size={16} />
              <span>Think</span>
            </PromptInputButton>
            <PromptInputButton
              className="!rounded-full text-foreground"
              variant="outline"
              onClick={onClearSession}
              disabled={disabled}
            >
              <Trash2Icon size={16} />
              <span>Clear</span>
            </PromptInputButton>
          </PromptInputTools>
          <div className="flex items-center gap-2">
            <ChatModelSelector
              model={model}
              onModelChange={onModelChange ?? (() => {})}
              onOpenChange={setModelSelectorOpen}
              open={modelSelectorOpen}
            />
            {isLoading ? (
              <PromptInputButton
                className="rounded-full bg-destructive font-medium text-destructive-foreground"
                onClick={onStop}
                variant="default"
              >
                <SquareIcon size={16} />
                <span className="sr-only">Stop</span>
              </PromptInputButton>
            ) : (
              <PromptInputButton
                className="rounded-full bg-foreground font-medium text-background"
                type="submit"
                variant="default"
                disabled={disabled || !text.trim()}
              >
                <SendIcon size={16} />
                <span className="sr-only">Send</span>
              </PromptInputButton>
            )}
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
