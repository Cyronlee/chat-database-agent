import { tool } from "ai"
import { z } from "zod"

// Tool that requires human approval (no execute function)
export const getWeatherInformation = tool({
  description: "Get current weather information for a specific city",
  inputSchema: z.object({
    city: z.string().describe("The city name to get weather for"),
    units: z
      .enum(["celsius", "fahrenheit"])
      .default("celsius")
      .describe("Temperature units"),
  }),
  outputSchema: z.object({
    city: z.string(),
    temperature: z.string(),
    conditions: z.string(),
    humidity: z.string(),
    windSpeed: z.string(),
    lastUpdated: z.string(),
  }),
  // No execute function - requires human approval
})

// Tool that auto-executes (has execute function)
export const getCurrentTime = tool({
  description: "Get the current time for a specific timezone",
  inputSchema: z.object({
    timezone: z
      .string()
      .default("UTC")
      .describe("The timezone to get current time for"),
  }),
  outputSchema: z.object({
    time: z.string(),
    timezone: z.string(),
  }),
  execute: async ({ timezone }) => {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZoneName: "short",
    })
    return {
      time: formatter.format(now),
      timezone,
    }
  },
})

// Tool for searching (requires human approval)
export const searchDatabase = tool({
  description: "Search the database for relevant information",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    limit: z
      .number()
      .default(10)
      .describe("Maximum number of results to return"),
  }),
  outputSchema: z.object({
    query: z.string(),
    totalResults: z.number(),
    results: z.array(
      z.object({
        id: z.number(),
        title: z.string(),
        snippet: z.string(),
        relevance: z.number(),
      })
    ),
  }),
  // No execute function - requires human approval
})

export const tools = {
  getWeatherInformation,
  getCurrentTime,
  searchDatabase,
}

// Execute functions for tools that require human approval
export async function executeWeatherTool({
  city,
  units,
}: {
  city: string
  units: "celsius" | "fahrenheit"
}) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const temp =
    units === "celsius"
      ? Math.floor(Math.random() * 35) + 5
      : Math.floor(Math.random() * 63) + 41

  const conditions = ["sunny", "cloudy", "rainy", "partly cloudy", "windy"]
  const condition = conditions[Math.floor(Math.random() * conditions.length)]

  return {
    city,
    temperature: `${temp}°${units === "celsius" ? "C" : "F"}`,
    conditions: condition,
    humidity: `${Math.floor(Math.random() * 60) + 30}%`,
    windSpeed: `${Math.floor(Math.random() * 30) + 5} ${
      units === "celsius" ? "km/h" : "mph"
    }`,
    lastUpdated: new Date().toLocaleString(),
  }
}

export async function executeSearchTool({
  query,
  limit,
}: {
  query: string
  limit: number
}) {
  // Simulate search delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  const results = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
    id: i + 1,
    title: `Result ${i + 1} for "${query}"`,
    snippet: `This is a sample search result matching your query about ${query}...`,
    relevance: Math.round((1 - i * 0.15) * 100) / 100,
  }))

  return {
    query,
    totalResults: results.length,
    results,
  }
}

// Helper to get tools that require confirmation
export function getToolsRequiringConfirmation(): string[] {
  return Object.entries(tools)
    .filter(([, toolDef]) => typeof toolDef.execute !== "function")
    .map(([name]) => name)
}
