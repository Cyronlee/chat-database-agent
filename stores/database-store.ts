import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface ExternalDatabase {
  id: string
  name: string
  host: string
  port: number
  database: string
  sslEnabled: boolean
  createdAt?: string
}

interface DatabaseStore {
  // Selected database ID (null means system database)
  selectedDatabaseId: string | null
  // Cached list of databases
  databases: ExternalDatabase[]
  // Loading state
  isLoading: boolean
  // Error state
  error: string | null
  // Actions
  setSelectedDatabase: (id: string | null) => void
  setDatabases: (databases: ExternalDatabase[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useDatabaseStore = create<DatabaseStore>()(
  persist(
    (set) => ({
      selectedDatabaseId: null,
      databases: [],
      isLoading: false,
      error: null,

      setSelectedDatabase: (id) => set({ selectedDatabaseId: id }),

      setDatabases: (databases) => set({ databases }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () =>
        set({
          selectedDatabaseId: null,
          databases: [],
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: "database-store",
      partialize: (state) => ({
        selectedDatabaseId: state.selectedDatabaseId,
      }),
    }
  )
)

