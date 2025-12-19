'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Habit {
  id: string
  name: string
  createdAt: string
}

const STORAGE_KEY = 'ajournl-habits'

function getStoredHabits(): Habit[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Habit[]
  } catch {
    return []
  }
}

function saveHabits(habits: Habit[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits))
}

// Initialize synchronously on client to avoid loading delay
function getInitialHabits(): Habit[] {
  if (typeof window === 'undefined') return []
  return getStoredHabits()
}

export function useHabits() {
  // Initialize with localStorage data immediately on client
  const [habits, setHabits] = useState<Habit[]>(getInitialHabits)
  const [isLoaded, setIsLoaded] = useState(() => typeof window !== 'undefined')

  // Mark as loaded on mount (handles SSR case)
  useEffect(() => {
    if (!isLoaded) {
      setHabits(getStoredHabits())
      setIsLoaded(true)
    }
  }, [isLoaded])

  useEffect(() => {
    if (isLoaded) {
      saveHabits(habits)
    }
  }, [habits, isLoaded])

  const addHabit = useCallback((name: string) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name: name.trim(),
      createdAt: new Date().toISOString(),
    }
    setHabits((prev) => [...prev, newHabit])
    return newHabit.id
  }, [])

  const removeHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }, [])

  const updateHabit = useCallback((id: string, name: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, name: name.trim() } : h))
    )
  }, [])

  return {
    habits,
    isLoaded,
    addHabit,
    removeHabit,
    updateHabit,
  }
}
