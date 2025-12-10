重构这个项目的布局，为全局的@app/layout.tsx 使用 sidebar，而不是在单独的页面@app/page.tsx 中使用 sidebar

然后调整@app/page.tsx 中的布局，我希望 header 部分固定不动，@components/chat/demo-grok.tsx 组件使用剩余的屏幕高度，@components/chat/demo-grok.tsx 中的 input 区域也固定在底部，聊天信息区域滚动
