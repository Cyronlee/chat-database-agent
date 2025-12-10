使用 ai-sdk，接入@reference/ai-sdk/google.md , 实现/api/chat 流式输出接口，并支持 thinking

然后在@components/chat/chat-window.tsx 中使用 useChat hook 调用/api/chat 接口，实现@reference/ai-sdk/human-in-the-loop.md 的功能，不再需要测试数据和旧 types，使用 ai-sdk 的包

需要注意，tool 的 ui 使用@reference/ai-elements/chatbot/tool.mdx 和@reference/ai-elements/chatbot/confirmation.mdx
