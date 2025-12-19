'use client'

import { useJournal } from '@/lib/useJournal'
import { useHabits } from '@/lib/useHabits'
import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { BookOpen, ChevronLeft, ChevronRight, Moon, Sun, Star, CheckSquare, Plus, X, Camera, Image as ImageIcon, Send, RefreshCw, Heart, Target } from 'lucide-react'

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
  const { habits, isLoaded: habitsLoaded, addHabit, removeHabit } = useHabits()
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [rating, setRating] = useState<string>('')
  const [sleepTime, setSleepTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [entry, setEntry] = useState('')
  const [completedHabits, setCompletedHabits] = useState<string[]>([])
  const [photo, setPhoto] = useState<string>('')
  const [gratitude, setGratitude] = useState<string[]>(['', '', ''])
  const [goals, setGoals] = useState<string[]>([''])
  const [currentPrompt, setCurrentPrompt] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [newHabitName, setNewHabitName] = useState('')
  const [showAddHabit, setShowAddHabit] = useState(false)
  const isInitialLoad = useRef(true)
  const saveEntryRef = useRef(saveEntry)
  const getEntryForDateRef = useRef(getEntryForDate)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastSavedData = useRef<string>('')

  // Keep refs up to date
  useEffect(() => {
    saveEntryRef.current = saveEntry
    getEntryForDateRef.current = getEntryForDate
  }, [saveEntry, getEntryForDate])

  // Load entry for current date
  useEffect(() => {
    if (!isLoaded) return

    isInitialLoad.current = true
    const existingEntry = getEntryForDateRef.current(currentDate)
    if (existingEntry) {
      setRating(existingEntry.rating?.toString() ?? '')
      setSleepTime(existingEntry.sleepTime ?? '')
      setWakeTime(existingEntry.wakeTime ?? '')
      setEntry(existingEntry.entry ?? '')
      setCompletedHabits(existingEntry.completedHabits ?? [])
      setPhoto(existingEntry.photo ?? '')
      setGratitude(existingEntry.gratitude ?? ['', '', ''])
      setGoals(existingEntry.goals?.length ? existingEntry.goals : [''])
    } else {
      setRating('')
      setSleepTime('')
      setWakeTime('')
      setEntry('')
      setCompletedHabits([])
      setPhoto('')
      setGratitude(['', '', ''])
      setGoals([''])
    }
    // Reset after state updates
    setTimeout(() => {
      isInitialLoad.current = false
    }, 50)
  }, [currentDate, isLoaded])

  // Initialize random prompt on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * JOURNAL_PROMPTS.length)
    setCurrentPrompt(JOURNAL_PROMPTS[randomIndex] ?? JOURNAL_PROMPTS[0] ?? '')
  }, [])

  // Auto-save on changes (skip initial load, debounced, only if data changed)
  useEffect(() => {
    if (!isLoaded || isInitialLoad.current) return

    const filledGratitude = gratitude.filter(g => g.trim())
    const filledGoals = goals.filter(g => g.trim())
    const hasContent = rating || sleepTime || wakeTime || entry || completedHabits.length > 0 || photo || filledGratitude.length > 0 || filledGoals.length > 0
    if (!hasContent) return

    // Create a hash of current data to check if it actually changed
    const currentData = JSON.stringify({ rating, sleepTime, wakeTime, entry, completedHabits, photo, gratitude, goals })
    if (currentData === lastSavedData.current) return

    setSaveStatus('saving')
    const timeout = setTimeout(() => {
      saveEntryRef.current(currentDate, {
        rating: rating ? parseInt(rating) : undefined,
        sleepTime: sleepTime || undefined,
        wakeTime: wakeTime || undefined,
        entry: entry || undefined,
        completedHabits: completedHabits.length > 0 ? completedHabits : undefined,
        photo: photo || undefined,
        gratitude: filledGratitude.length > 0 ? gratitude : undefined,
        goals: filledGoals.length > 0 ? goals : undefined,
      })
      lastSavedData.current = currentData
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 1500)
    }, 1000)

    return () => clearTimeout(timeout)
  }, [rating, sleepTime, wakeTime, entry, completedHabits, photo, gratitude, goals, currentDate, isLoaded])

  const goToPreviousDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() - 24 * 60 * 60 * 1000))
  }

  const goToNextDay = () => {
    setCurrentDate((prev) => new Date(prev.getTime() + 24 * 60 * 60 * 1000))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const toggleHabit = (habitId: string) => {
    setCompletedHabits((prev) =>
      prev.includes(habitId)
        ? prev.filter((id) => id !== habitId)
        : [...prev, habitId]
    )
  }

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return
    addHabit(newHabitName)
    setNewHabitName('')
    setShowAddHabit(false)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      // Resize image to reduce storage size
      const img = document.createElement('img')
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxSize = 800
        let { width, height } = img

        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const resized = canvas.toDataURL('image/jpeg', 0.7)
        setPhoto(resized)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhoto('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateGratitude = (index: number, value: string) => {
    setGratitude(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const updateGoal = (index: number, value: string) => {
    setGoals(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  const addGoal = () => {
    if (goals.length < 5) {
      setGoals(prev => [...prev, ''])
    }
  }

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(prev => prev.filter((_, i) => i !== index))
    }
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

  const submitToGoogleDocs = async () => {
    setSubmitStatus('submitting')

    // Get habit names for completed habits
    const completedHabitNames = habits
      .filter((h) => completedHabits.includes(h.id))
      .map((h) => h.name)

    const filledGratitude = gratitude.filter(g => g.trim())
    const filledGoals = goals.filter(g => g.trim())

    const payload = {
      date: format(currentDate, 'MMMM d, yyyy'),
      timestamp: format(new Date(), 'h:mm a').toLowerCase(),
      rating: rating ? parseInt(rating) : null,
      sleepTime: sleepMinutesFromBase !== null ? formatSleepDisplay(sleepMinutesFromBase) : null,
      wakeTime: wakeMinutesFromBase !== null ? formatWakeDisplay(wakeMinutesFromBase) : null,
      completedHabits: completedHabitNames.length > 0 ? completedHabitNames : null,
      gratitude: filledGratitude.length > 0 ? filledGratitude : null,
      goals: filledGoals.length > 0 ? filledGoals : null,
      photo: photo || null,
      entry: entry || null,
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requires no-cors
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // With no-cors we can't read the response, but if it didn't throw, assume success
      setSubmitStatus('success')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } catch (error) {
      console.error('Failed to submit to Google Docs:', error)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }
  }

  const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

  // Sleep time: 8 PM (20:00) to 3 AM (27:00 / next day 03:00) = 7 hours range
  // We use minutes from 8 PM as the value (0 = 20:00, 420 = 03:00)
  const sleepMinutesFromBase = sleepTime
    ? (() => {
        const [h, m] = sleepTime.split(':').map(Number)
        // Convert to minutes from 8 PM base
        // If hour is 20-23, it's same day. If 0-3, it's next day (add 24)
        const hour = h !== undefined ? h : 0
        const minute = m !== undefined ? m : 0
        const adjustedHour = hour < 20 ? hour + 24 : hour
        return (adjustedHour - 20) * 60 + minute
      })()
    : null

  const formatSleepTime = (minutes: number) => {
    const totalMinutes = 20 * 60 + minutes // Add to 8 PM base
    let hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    if (hour >= 24) hour -= 24
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const formatSleepDisplay = (minutes: number) => {
    const totalMinutes = 20 * 60 + minutes
    let hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    if (hour >= 24) hour -= 24
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Wake time: 5 AM to 12 PM = 7 hours range
  const wakeMinutesFromBase = wakeTime
    ? (() => {
        const [h, m] = wakeTime.split(':').map(Number)
        const hour = h !== undefined ? h : 0
        const minute = m !== undefined ? m : 0
        return (hour - 5) * 60 + minute
      })()
    : null

  const formatWakeTime = (minutes: number) => {
    const totalMinutes = 5 * 60 + minutes // Add to 5 AM base
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  const formatWakeDisplay = (minutes: number) => {
    const totalMinutes = 5 * 60 + minutes
    const hour = Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`
  }

  // Show loading skeleton during SSR/initial hydration
  if (!isLoaded) {
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
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-lg border border-border bg-white p-4">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200 mb-3" />
                <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
              </div>
            ))}
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
          <div className="text-sm text-muted">
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'saved' && 'Saved'}
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

        {/* Journal Form */}
        <div className="space-y-6">
          {/* Goals for Today */}
          <div className="rounded-lg border border-border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-muted">
                <Target className="h-4 w-4" />
                Goals for Today
              </label>
              {goals.length < 5 && (
                <button
                  onClick={addGoal}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-electric-blue transition-colors hover:bg-electric-blue/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              {goals.map((goal, index) => (
                <div key={index} className="flex items-center gap-2 group">
                  <span className="text-sm text-muted w-5">{index + 1}.</span>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    placeholder="What do you want to accomplish?"
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
                  />
                  {goals.length > 1 && (
                    <button
                      onClick={() => removeGoal(index)}
                      className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
                      aria-label="Remove goal"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gratitude */}
          <div className="rounded-lg border border-border bg-white p-4">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <Heart className="h-4 w-4" />
              Grateful for...
            </label>
            <div className="space-y-2">
              {gratitude.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-muted w-5">{index + 1}.</span>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateGratitude(index, e.target.value)}
                    placeholder={index === 0 ? "Something that made you happy..." : index === 1 ? "Someone you appreciate..." : "A small thing you're thankful for..."}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Day Rating */}
          <div className="rounded-lg border border-border bg-white p-4">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <Star className="h-4 w-4" />
              How was your day?
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <div className="h-2 w-full rounded-full bg-gray-200" />
                <div
                  className="absolute left-0 top-0 h-2 rounded-full bg-electric-blue"
                  style={{ width: rating ? `${((parseInt(rating) - 1) / 9) * 100}%` : '0%' }}
                />
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rating || 5}
                  onChange={(e) => setRating(e.target.value)}
                  className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                />
                <div
                  className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-electric-blue bg-white shadow-md"
                  style={{ left: rating ? `calc(${((parseInt(rating) - 1) / 9) * 100}% - 10px)` : 'calc(50% - 10px)' }}
                />
              </div>
              <span className="w-8 text-center text-lg font-semibold text-electric-blue">
                {rating || '-'}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>Rough</span>
              <span>Amazing</span>
            </div>
          </div>

          {/* Sleep & Wake Time Sliders */}
          <div className="rounded-lg border border-border bg-white p-4 space-y-6">
            {/* Sleep Time */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
                <Moon className="h-4 w-4" />
                Sleep time
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="h-2 w-full rounded-full bg-gray-200" />
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-electric-blue"
                    style={{ width: sleepMinutesFromBase !== null ? `${(sleepMinutesFromBase / 420) * 100}%` : '0%' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="420"
                    step="15"
                    value={sleepMinutesFromBase ?? 180}
                    onChange={(e) => setSleepTime(formatSleepTime(parseInt(e.target.value)))}
                    className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-electric-blue bg-white shadow-md"
                    style={{ left: sleepMinutesFromBase !== null ? `calc(${(sleepMinutesFromBase / 420) * 100}% - 10px)` : 'calc(43% - 10px)' }}
                  />
                </div>
                <span className="w-20 text-right text-lg font-semibold text-electric-blue">
                  {sleepMinutesFromBase !== null ? formatSleepDisplay(sleepMinutesFromBase) : '-'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>8 PM</span>
                <span>3 AM</span>
              </div>
            </div>

            {/* Wake Time */}
            <div>
              <label className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
                <Sun className="h-4 w-4" />
                Wake time
              </label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <div className="h-2 w-full rounded-full bg-gray-200" />
                  <div
                    className="absolute left-0 top-0 h-2 rounded-full bg-electric-blue"
                    style={{ width: wakeMinutesFromBase !== null ? `${(wakeMinutesFromBase / 420) * 100}%` : '0%' }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="420"
                    step="15"
                    value={wakeMinutesFromBase ?? 120}
                    onChange={(e) => setWakeTime(formatWakeTime(parseInt(e.target.value)))}
                    className="absolute inset-0 h-2 w-full cursor-pointer opacity-0"
                  />
                  <div
                    className="pointer-events-none absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-[3px] border-electric-blue bg-white shadow-md"
                    style={{ left: wakeMinutesFromBase !== null ? `calc(${(wakeMinutesFromBase / 420) * 100}% - 10px)` : 'calc(29% - 10px)' }}
                  />
                </div>
                <span className="w-20 text-right text-lg font-semibold text-electric-blue">
                  {wakeMinutesFromBase !== null ? formatWakeDisplay(wakeMinutesFromBase) : '-'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>5 AM</span>
                <span>12 PM</span>
              </div>
            </div>
          </div>

          {/* Habits */}
          {habitsLoaded && (
            <div className="rounded-lg border border-border bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-muted">
                  <CheckSquare className="h-4 w-4" />
                  Daily Habits
                </label>
                <button
                  onClick={() => setShowAddHabit(!showAddHabit)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-electric-blue transition-colors hover:bg-electric-blue/10"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {showAddHabit && (
                <div className="mb-3 flex gap-2">
                  <input
                    type="text"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                    placeholder="New habit name..."
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
                    autoFocus
                  />
                  <button
                    onClick={handleAddHabit}
                    className="rounded-lg bg-electric-blue px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-electric-blue-dark"
                  >
                    Add
                  </button>
                </div>
              )}

              {habits.length === 0 ? (
                <p className="text-sm text-muted">No habits yet. Add one to start tracking!</p>
              ) : (
                <div className="space-y-2">
                  {habits.map((habit) => (
                    <div key={habit.id} className="flex items-center gap-3 group">
                      <button
                        onClick={() => toggleHabit(habit.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded border-2 transition-colors ${
                          completedHabits.includes(habit.id)
                            ? 'border-electric-blue bg-electric-blue text-white'
                            : 'border-gray-300 hover:border-electric-blue'
                        }`}
                      >
                        {completedHabits.includes(habit.id) && (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className={`flex-1 ${completedHabits.includes(habit.id) ? 'text-muted line-through' : ''}`}>
                        {habit.name}
                      </span>
                      <button
                        onClick={() => removeHabit(habit.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
                        aria-label={`Remove ${habit.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Photo */}
          <div className="rounded-lg border border-border bg-white p-4">
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <Camera className="h-4 w-4" />
              Photo
            </label>

            {photo ? (
              <div className="relative">
                <img
                  src={photo}
                  alt="Photo of the day"
                  className="w-full rounded-lg object-cover"
                />
                <button
                  onClick={removePhoto}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-8 transition-colors hover:border-electric-blue hover:bg-electric-blue/5">
                <ImageIcon className="mb-2 h-8 w-8 text-muted" />
                <span className="text-sm text-muted">Tap to add a photo</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Journal Entry */}
          <div className="rounded-lg border border-border bg-white p-4">
            <label htmlFor="entry" className="mb-2 block text-sm font-medium text-muted">
              Today&apos;s thoughts
            </label>

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
              rows={10}
              className="w-full resize-none rounded-lg border border-border px-3 py-2 focus:border-electric-blue focus:outline-none focus:ring-1 focus:ring-electric-blue"
            />
          </div>

          {/* Submit to Google Docs */}
          <button
            onClick={submitToGoogleDocs}
            disabled={submitStatus === 'submitting'}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium text-white transition-colors ${
              submitStatus === 'submitting'
                ? 'cursor-not-allowed bg-gray-400'
                : submitStatus === 'success'
                  ? 'bg-success-green'
                  : submitStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-electric-blue hover:bg-electric-blue-dark'
            }`}
          >
            <Send className="h-5 w-5" />
            {submitStatus === 'submitting' && 'Sending to Google Docs...'}
            {submitStatus === 'success' && 'Sent to Google Docs!'}
            {submitStatus === 'error' && 'Failed - Try Again'}
            {submitStatus === 'idle' && 'Submit to Google Docs'}
          </button>
        </div>
      </div>
    </main>
  )
}
