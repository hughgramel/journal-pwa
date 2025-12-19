'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

export interface JournalEntry {
  id: string
  date: string // YYYY-MM-DD format
  rating?: number // 1-10
  sleepTime?: string // HH:MM format
  wakeTime?: string // HH:MM format
  entry?: string
  completedHabits?: string[] // Array of habit IDs completed for this day
  photo?: string // Base64 encoded image
  gratitude?: string[] // Array of up to 3 gratitude items
  goals?: string[] // Array of daily goals
  updatedAt: string
}

const STORAGE_KEY = 'ajournl-entries'

function getStoredEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as JournalEntry[]
  } catch {
    return []
  }
}

function saveEntries(entries: JournalEntry[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

// Initialize synchronously on client to avoid loading delay
function getInitialEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []
  return getStoredEntries()
}

export function useJournal() {
  // Initialize with localStorage data immediately on client
  const [entries, setEntries] = useState<JournalEntry[]>(getInitialEntries)
  const [isLoaded, setIsLoaded] = useState(() => typeof window !== 'undefined')

  // Mark as loaded on mount (handles SSR case)
  useEffect(() => {
    if (!isLoaded) {
      setEntries(getStoredEntries())
      setIsLoaded(true)
    }
  }, [isLoaded])

  useEffect(() => {
    if (isLoaded) {
      saveEntries(entries)
    }
  }, [entries, isLoaded])

  const getEntryForDate = useCallback(
    (date: Date): JournalEntry | undefined => {
      const dateStr = format(date, 'yyyy-MM-dd')
      return entries.find((e) => e.date === dateStr)
    },
    [entries]
  )

  const saveEntry = useCallback(
    (date: Date, data: { rating?: number; sleepTime?: string; wakeTime?: string; entry?: string; completedHabits?: string[]; photo?: string; gratitude?: string[]; goals?: string[] }) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const existing = entries.find((e) => e.date === dateStr)

      if (existing) {
        setEntries((prev) =>
          prev.map((e) =>
            e.date === dateStr
              ? { ...e, ...data, updatedAt: new Date().toISOString() }
              : e
          )
        )
      } else {
        const newEntry: JournalEntry = {
          id: crypto.randomUUID(),
          date: dateStr,
          ...data,
          updatedAt: new Date().toISOString(),
        }
        setEntries((prev) => [newEntry, ...prev])
      }
    },
    [entries]
  )

  const deleteEntry = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    setEntries((prev) => prev.filter((e) => e.date !== dateStr))
  }, [])

  return {
    entries,
    isLoaded,
    getEntryForDate,
    saveEntry,
    deleteEntry,
  }
}
