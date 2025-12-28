'use client'

import { useJournal } from '@/lib/useJournal'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { BookOpen, ChevronLeft, ChevronRight, Check, RefreshCw, Send } from 'lucide-react'

const JOURNAL_PROMPTS = [
  "What made you smile today?",
  "What's something you learned recently?",
  "What are you looking forward to?",
  "What challenge did you overcome today?",
  "Who made a positive impact on your day?",
  "What's something you're proud of?",
  "What would make tomorrow great?",
  "What's been on your mind lately?",
  "Describe a moment of peace you experienced today.",
  "What's a small win you had today?",
  "What are you curious about right now?",
  "What boundary did you set or need to set?",
  "What's something you want to remember about today?",
  "How did you take care of yourself today?",
  "What conversation stuck with you today?",
  "What's something that surprised you?",
  "What are you letting go of?",
  "What's giving you energy right now?",
  "What's draining your energy?",
  "What would your future self thank you for?",
]

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgJIm-9XXzmjPp1nlwHr6u1BK47Oilk3wZdUVn5Rbvz1i3ZFn1ixvZpTM-kTQIORhNgw/exec'

export default function Home() {
  const { getEntryForDate, saveEntry, isLoaded } = useJournal()
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [entry, setEntry] = useState('')
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const isInitialLoad = useRef(true)
  const saveEntryRef = useRef(saveEntry)
  const getEntryForDateRef = useRef(getEntryForDate)
  const lastSavedData = useRef<string>('')
  const lastSubmittedEntry = useRef<string>('')

  // Initialize on mount (client-side only)
  useEffect(() => {
    setMounted(true)
    setCurrentDate(new Date())
    const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length)
    setCurrentPrompt(JOURNAL_PROMPTS[randomIndex] ?? '')
  }, [])

  // Keep refs up to date
  useEffect(() => {
    saveEntryRef.current = saveEntry
    getEntryForDateRef.current = getEntryForDate
  }, [saveEntry, getEntryForDate])

  // Load entry for current date
  useEffect(() => {
    if (!isLoaded || !currentDate) return

    isInitialLoad.current = true
    const existingEntry = getEntryForDateRef.current(currentDate)
    if (existingEntry) {
      setEntry(existingEntry.entry ?? '')
    } else {
      setEntry('')
    }
    // Reset after state updates
    setTimeout(() => {
      isInitialLoad.current = false
    }, 50)
  }, [currentDate, isLoaded])

  // Auto-save on changes (skip initial load, debounced, only if data changed)
  useEffect(() => {
    if (!isLoaded || !currentDate || isInitialLoad.current) return

    const hasContent = entry.trim()
    if (!hasContent) return

    // Create a hash of current data to check if it actually changed
    const currentData = JSON.stringify({ entry })
    if (currentData === lastSavedData.current) return

    setSaveStatus('saving')
    const timeout = setTimeout(() => {
      saveEntryRef.current(currentDate, {
        entry: entry || undefined,
      })
      lastSavedData.current = currentData
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [entry, currentDate, isLoaded])

  // Background submit to Google Docs when entry changes
  useEffect(() => {
    if (!isLoaded || !currentDate || isInitialLoad.current) return

    const trimmedEntry = entry.trim()
    if (!trimmedEntry) return

    // Only submit if entry actually changed from last submission
    if (trimmedEntry === lastSubmittedEntry.current) return

    const timeout = setTimeout(async () => {
      setSubmitStatus('submitting')

      const payload = {
        date: format(currentDate, 'MMMM d, yyyy'),
        timestamp: format(new Date(), 'h:mm a').toLowerCase(),
        entry: entry || null,
      }

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        lastSubmittedEntry.current = trimmedEntry
        setSubmitStatus('success')
        setTimeout(() => setSubmitStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to submit:', error)
        setSubmitStatus('idle')
      }
    }, 2000) // Debounce submissions by 2 seconds

    return () => clearTimeout(timeout)
  }, [entry, currentDate, isLoaded])

  const goToPreviousDay = () => {
    setCurrentDate((prev) => prev ? new Date(prev.getTime() - 24 * 60 * 60 * 1000) : null)
  }

  const goToNextDay = () => {
    setCurrentDate((prev) => prev ? new Date(prev.getTime() + 24 * 60 * 60 * 1000) : null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const refreshPrompt = () => {
    let newPrompt = currentPrompt
    let attempts = 0
    while (newPrompt === currentPrompt && JOURNAL_PROMPTS.length > 1 && attempts < 10) {
      const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length)
      newPrompt = JOURNAL_PROMPTS[randomIndex] ?? currentPrompt
      attempts++
    }
    setCurrentPrompt(newPrompt)
  }

  const manualSubmit = async () => {
    if (!currentDate || !entry.trim()) return

    setSubmitStatus('submitting')

    const payload = {
      date: format(currentDate, 'MMMM d, yyyy'),
      timestamp: format(new Date(), 'h:mm a').toLowerCase(),
      entry: entry || null,
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      lastSubmittedEntry.current = entry.trim()
      setSubmitStatus('success')
      setTimeout(() => setSubmitStatus('idle'), 2000)
    } catch (error) {
      console.error('Failed to submit:', error)
      setSubmitStatus('idle')
    }
  }

  const isToday = currentDate ? format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') : true

  // Show loading skeleton during SSR/initial hydration
  if (!mounted || !isLoaded || !currentDate) {
    return (
      <main className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-electric-blue" />
              <h1 className="text-xl font-bold text-foreground">ajournl.</h1>
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="mb-6 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-32 animate-pulse rounded bg-gray-200 mx-auto mb-2" />
              <div className="h-5 w-40 animate-pulse rounded bg-gray-100 mx-auto" />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-3" />
            <div className="h-16 w-full animate-pulse rounded bg-gray-100 mb-3" />
            <div className="h-64 w-full animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-electric-blue" />
            <h1 className="text-xl font-bold text-foreground">ajournl.</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
            {submitStatus === 'submitting' && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-electric-blue" />
                Submitting...
              </span>
            )}
            {submitStatus === 'success' && (
              <span className="flex items-center gap-1 text-success-green">
                <Check className="h-4 w-4" />
                Submitted
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Date Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={goToPreviousDay}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              {format(currentDate, 'EEEE')}
            </h2>
            <p className="text-muted">
              {format(currentDate, 'MMMM d, yyyy')}
            </p>
            {!isToday && (
              <button
                onClick={goToToday}
                className="mt-1 text-sm text-electric-blue hover:underline"
              >
                Go to today
              </button>
            )}
          </div>

          <button
            onClick={goToNextDay}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100"
            aria-label="Next day"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Journal Entry */}
        <div className="rounded-lg border border-border bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <label htmlFor="entry" className="block text-sm font-medium text-muted">
              Today&apos;s thoughts
            </label>
            <span className="text-xs text-muted">
              Submit instantly
            </span>
          </div>

          {/* Journal Prompt */}
          <div className="mb-3 flex items-start gap-2 rounded-lg bg-electric-blue/5 p-3">
            <p className="flex-1 text-sm italic text-electric-blue">
              {currentPrompt}
            </p>
            <button
              onClick={refreshPrompt}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-electric-blue transition-colors hover:bg-electric-blue/10"
              aria-label="Get new prompt"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <textarea
            id="entry"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Start writing..."
            rows={12}
            className="w-full resize-none rounded-lg border border-border px-3 py-2 focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
          />
        </div>

        {/* Submit Button */}
        <button
          onClick={manualSubmit}
          disabled={submitStatus === 'submitting' || !entry.trim()}
          className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-colors ${
            submitStatus === 'submitting' || !entry.trim()
              ? 'cursor-not-allowed bg-gray-400'
              : submitStatus === 'success'
                ? 'bg-success-green'
                : 'bg-electric-blue hover:bg-electric-blue-dark'
          }`}
        >
          <Send className="h-5 w-5" />
          {submitStatus === 'submitting' && 'Submitting...'}
          {submitStatus === 'success' && 'Submitted!'}
          {submitStatus === 'idle' && 'Submit instantly'}
        </button>
      </div>
    </main>
  )
}
