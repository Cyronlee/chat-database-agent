# Google Generative AI Provider

### Thinking

The Gemini 2.5 and Gemini 3 series models use an internal "thinking process" that significantly improves their reasoning and multi-step planning abilities, making them highly effective for complex tasks such as coding, advanced mathematics, and data analysis. For more information see [Google Generative AI thinking documentation](https://ai.google.dev/gemini-api/docs/thinking).

#### Gemini 3 Models

For Gemini 3 models, use the `thinkingLevel` parameter to control the depth of reasoning:

```ts
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import { generateText } from "ai"

const model = google("gemini-3-pro-preview")

const { text, reasoning } = await generateText({
  model: model,
  prompt: "What is the sum of the first 10 prime numbers?",
  providerOptions: {
    google: {
      thinkingConfig: {
        thinkingLevel: "high",
        includeThoughts: true,
      },
    } satisfies GoogleGenerativeAIProviderOptions,
  },
})

console.log(text)

console.log(reasoning) // Reasoning summary
```

#### Gemini 2.5 Models

For Gemini 2.5 models, use the `thinkingBudget` parameter to control the number of thinking tokens:

```ts
import { google, GoogleGenerativeAIProviderOptions } from "@ai-sdk/google"
import { generateText } from "ai"

const model = google("gemini-2.5-flash")

const { text, reasoning } = await generateText({
  model: model,
  prompt: "What is the sum of the first 10 prime numbers?",
  providerOptions: {
    google: {
      thinkingConfig: {
        thinkingBudget: 8192,
        includeThoughts: true,
      },
    } satisfies GoogleGenerativeAIProviderOptions,
  },
})

console.log(text)

console.log(reasoning) // Reasoning summary
```

### File Inputs

The Google Generative AI provider supports file inputs, e.g. PDF files.

```ts
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

const result = await generateText({
  model: google("gemini-2.5-flash"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "What is an embedding model according to this document?",
        },
        {
          type: "file",
          data: fs.readFileSync("./data/ai.pdf"),
          mediaType: "application/pdf",
        },
      ],
    },
  ],
})
```

You can also use YouTube URLs directly:

```ts
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

const result = await generateText({
  model: google("gemini-2.5-flash"),
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: "Summarize this video",
        },
        {
          type: "file",
          data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          mediaType: "video/mp4",
        },
      ],
    },
  ],
})
```
