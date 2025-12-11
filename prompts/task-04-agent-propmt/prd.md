将@app/api/chat/route.ts 中的 agent system prompt 维护在@agent/jira-report-agent.ts 中，我希望这个 agent 的功能如下

- 用户的需求一般是查询数据库，并获得最终的数据报表
- agent 要具有澄清用户需求的能力，可以编写示例查询进行数据验证（做一些数据量限制，自动使用工具），给出最终的查询 sql（不做 limit 限制，不调用工具）
- 我会提供一些业务上下文，以及示例查询，拼接到 system prompt 中

因此我希望添加一个自定义解析器，例如让 agent 把最终 sql 生成到<sql></sql>中包裹起来，然后前端识别到之后，会自动调用@app/api/database/query/route.ts 进行查询，并将结果渲染出来（ui 参考@components/database/query-results.tsx 组件）

需要注意@components/ai-elements/message.tsx 中的流式 markdown 解析用的是 Streamdown 库，你需要保证兼容性
