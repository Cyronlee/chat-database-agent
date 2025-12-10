import { ChatWindow } from "@/components/chat/chat-window"

export default function Page() {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-b from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <ChatWindow />
    </div>
  )
}
