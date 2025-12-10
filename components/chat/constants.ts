import type { MessageType, ModelType } from "./types"
import { nanoid } from "nanoid"

export const models: ModelType[] = [
  {
    id: "grok-3",
    name: "Grok-3",
    chef: "xAI",
    chefSlug: "xai",
    providers: ["xai"],
  },
  {
    id: "grok-2-1212",
    name: "Grok-2-1212",
    chef: "xAI",
    chefSlug: "xai",
    providers: ["xai"],
  },
]

export const mockMessages: MessageType[] = [
  {
    key: nanoid(),
    from: "user",
    versions: [
      {
        id: nanoid(),
        content: "Can you explain how to use React hooks effectively?",
      },
    ],
  },
  {
    key: nanoid(),
    from: "assistant",
    sources: [
      {
        href: "https://react.dev/reference/react",
        title: "React Documentation",
      },
      {
        href: "https://react.dev/reference/react-dom",
        title: "React DOM Documentation",
      },
    ],
    tools: [
      {
        name: "mcp",
        description: "Searching React documentation",
        status: "input-available",
        parameters: {
          query: "React hooks best practices",
          source: "react.dev",
        },
        result: `{
  "query": "React hooks best practices",
  "results": [
    {
      "title": "Rules of Hooks",
      "url": "https://react.dev/warnings/invalid-hook-call-warning",
      "snippet": "Hooks must be called at the top level of your React function components or custom hooks. Don't call hooks inside loops, conditions, or nested functions."
    },
    {
      "title": "useState Hook",
      "url": "https://react.dev/reference/react/useState",
      "snippet": "useState is a React Hook that lets you add state to your function components. It returns an array with two values: the current state and a function to update it."
    },
    {
      "title": "useEffect Hook",
      "url": "https://react.dev/reference/react/useEffect",
      "snippet": "useEffect lets you synchronize a component with external systems. It runs after render and can be used to perform side effects like data fetching."
    }
  ]
}`,
        error: undefined,
      },
    ],
    versions: [
      {
        id: nanoid(),
        content: `# React Hooks Best Practices

React hooks are a powerful feature that let you use state and other React features without writing classes. Here are some tips for using them effectively:

## Rules of Hooks

1. **Only call hooks at the top level** of your component or custom hooks
2. **Don't call hooks inside loops, conditions, or nested functions**

## Common Hooks

- **useState**: For local component state
- **useEffect**: For side effects like data fetching
- **useContext**: For consuming context
- **useReducer**: For complex state logic
- **useCallback**: For memoizing functions
- **useMemo**: For memoizing values

## Example of useState and useEffect

\`\`\`jsx
function ProfilePage({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // This runs after render and when userId changes
    fetchUser(userId).then(userData => {
      setUser(userData);
    });
  }, [userId]);
  
  return user ? <Profile user={user} /> : <Loading />;
}
\`\`\`

Would you like me to explain any specific hook in more detail?`,
      },
    ],
  },
  {
    key: nanoid(),
    from: "user",
    versions: [
      {
        id: nanoid(),
        content:
          "Yes, could you explain useCallback and useMemo in more detail? When should I use one over the other?",
      },
      {
        id: nanoid(),
        content:
          "I'm particularly interested in understanding the performance implications of useCallback and useMemo. Could you break down when each is most appropriate?",
      },
      {
        id: nanoid(),
        content:
          "Thanks for the overview! Could you dive deeper into the specific use cases where useCallback and useMemo make the biggest difference in React applications?",
      },
    ],
  },
  {
    key: nanoid(),
    from: "assistant",
    reasoning: {
      content: `The user is asking for a detailed explanation of useCallback and useMemo. I should provide a clear and concise explanation of each hook's purpose and how they differ.
      
The useCallback hook is used to memoize functions to prevent unnecessary re-renders of child components that receive functions as props.

The useMemo hook is used to memoize values to avoid expensive recalculations on every render.

Both hooks help with performance optimization, but they serve different purposes.`,
      duration: 10,
    },
    versions: [
      {
        id: nanoid(),
        content: `## useCallback vs useMemo

Both hooks help with **performance optimization**, but they serve _different purposes_:

### useCallback

\`useCallback\` memoizes __functions__ to prevent unnecessary re-renders of child components that receive functions as props.

\`\`\`jsx
// Without useCallback - a new function is created on every render
const handleClick = () => {
  console.log(count);
};

// With useCallback - the function is only recreated when dependencies change
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
\`\`\`

### useMemo

\`useMemo\` memoizes *values* to avoid expensive recalculations on every render.

\`\`\`jsx
// Without useMemo - expensive calculation runs on every render
const sortedList = expensiveSort(items);

// With useMemo - calculation only runs when items change
const sortedList = useMemo(() => expensiveSort(items), [items]);
\`\`\`

### When to use which?

- Use **useCallback** when:
  - Passing callbacks to optimized child components that rely on reference equality
  - Working with event handlers that you pass to child components

- Use **useMemo** when:
  - You have computationally expensive calculations
  - You want to avoid recreating objects that are used as dependencies for other hooks

### Performance Note

Don't overuse these hooks! They come with their own overhead. Only use them when you have identified a genuine performance issue.

### ~~Legacy Patterns~~

Remember that these ~~outdated approaches~~ should be avoided:
- ~~Class components for simple state~~ - Use \`useState\` instead
- ~~Manual event listener cleanup~~ - Let \`useEffect\` handle it`,
      },
    ],
  },
]

export const mockMessageResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles and best practices in the field.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic that comes up frequently. The solution typically involves understanding the core concepts and applying them in the right context. Here's what I recommend...",
  "Great choice of topic! This is something that many developers encounter. The approach I'd suggest is to start with the fundamentals and then build up to more complex scenarios.",
  "That's definitely worth exploring. From what I can see, the best way to handle this is to consider both the theoretical aspects and practical implementation details.",
]
