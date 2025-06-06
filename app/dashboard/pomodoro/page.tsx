"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Play, Pause, RotateCcw, Volume2, VolumeX, Bell, BellOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { NotificationService } from "@/lib/notification-service"

// Storage keys
const POMODORO_STORAGE_KEY = "pomodoro-state"
const POMODORO_SETTINGS_KEY = "pomodoro-settings"

export default function PomodoroPage() {
  const { toast } = useToast()
  const [mode, setMode] = useState("pomodoro")
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isActive, setIsActive] = useState(false)
  const [settings, setSettings] = useState({
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    volume: 50,
    soundEnabled: true,
    notificationsEnabled: true,
  })
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [sessionHistory, setSessionHistory] = useState([])
  const [lastSavedTime, setLastSavedTime] = useState(Date.now())

  const timerRef = useRef(null)
  const saveTimeoutRef = useRef(null)

  // Load saved state on mount
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(POMODORO_STORAGE_KEY)
      const savedSettings = localStorage.getItem(POMODORO_SETTINGS_KEY)

      if (savedState) {
        const state = JSON.parse(savedState)
        const timeSinceLastSave = Date.now() - state.timestamp

        // Only restore if less than 1 hour has passed
        if (timeSinceLastSave < 3600000) {
          setMode(state.mode)
          setTimeLeft(state.timeLeft)
          setIsActive(false) // Always start paused
          setCompletedPomodoros(state.completedPomodoros)
          setSessionHistory(state.sessionHistory || [])
        }
      }

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings)
        setSettings(parsedSettings)
      }
    } catch (error) {
      console.error("Error loading pomodoro state:", error)
    }
  }, [])

  // Save state periodically
  const saveState = useCallback(() => {
    try {
      const state = {
        mode,
        timeLeft,
        isActive,
        completedPomodoros,
        sessionHistory,
        timestamp: Date.now(),
      }
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(state))
    } catch (error) {
      console.error("Error saving pomodoro state:", error)
    }
  }, [mode, timeLeft, isActive, completedPomodoros, sessionHistory])

  // Save settings
  const saveSettings = useCallback(() => {
    try {
      localStorage.setItem(POMODORO_SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error("Error saving pomodoro settings:", error)
    }
  }, [settings])

  // Auto-save state every 10 seconds when active
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(saveState, 10000)
      return () => clearInterval(interval)
    }
  }, [isActive, saveState])

  // Save settings when they change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(saveSettings, 1000)
  }, [settings, saveSettings])

  // Initialize timer based on mode (only when mode changes, not settings)
  useEffect(() => {
    if (mode === "pomodoro") {
      setTimeLeft(settings.pomodoro * 60)
    } else if (mode === "shortBreak") {
      setTimeLeft(settings.shortBreak * 60)
    } else if (mode === "longBreak") {
      setTimeLeft(settings.longBreak * 60)
    }
    setIsActive(false) // Always pause when switching modes
  }, [mode]) // Only depend on mode, not settings

  // Play sound function
  const playSound = useCallback(() => {
    if (settings.soundEnabled) {
      NotificationService.playSound("timer", settings.volume)
    }
  }, [settings.soundEnabled, settings.volume])

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (isActive && timeLeft === 0) {
      // Timer completed
      playSound()

      // Show notification
      if (settings.notificationsEnabled) {
        const title = mode === "pomodoro" ? "Work session completed!" : "Break time over!"
        const body = mode === "pomodoro" ? "Time to take a break!" : "Time to get back to work!"

        NotificationService.showNotification(
          title,
          {
            body: body,
            icon: "/favicon.ico",
          },
          "timer",
          settings.volume,
        )
      }

      toast({
        title: `${mode === "pomodoro" ? "Work session" : "Break"} completed!`,
        description: `Time to ${mode === "pomodoro" ? "take a break" : "get back to work"}!`,
      })

      if (mode === "pomodoro") {
        const newCompletedCount = completedPomodoros + 1
        setCompletedPomodoros(newCompletedCount)
        setSessionHistory((prev) => [
          ...prev,
          {
            type: "pomodoro",
            duration: settings.pomodoro,
            completedAt: new Date().toISOString(),
          },
        ])

        // Determine which break to take
        if (newCompletedCount % 4 === 0) {
          setMode("longBreak")
        } else {
          setMode("shortBreak")
        }

        // Auto-start break if enabled
        if (settings.autoStartBreaks) {
          setTimeout(() => setIsActive(true), 1000)
        }
      } else {
        // Break completed, back to pomodoro
        setMode("pomodoro")

        // Auto-start pomodoro if enabled
        if (settings.autoStartPomodoros) {
          setTimeout(() => setIsActive(true), 1000)
        }
      }

      // Save state after completion
      saveState()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isActive, timeLeft, mode, completedPomodoros, settings, toast, playSound, saveState])

  const toggleTimer = useCallback(() => {
    setIsActive(!isActive)
  }, [isActive])

  const resetTimer = useCallback(() => {
    setIsActive(false)
    if (mode === "pomodoro") {
      setTimeLeft(settings.pomodoro * 60)
    } else if (mode === "shortBreak") {
      setTimeLeft(settings.shortBreak * 60)
    } else if (mode === "longBreak") {
      setTimeLeft(settings.longBreak * 60)
    }
    saveState()
  }, [mode, settings, saveState])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }, [])

  const toggleSound = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      soundEnabled: !prev.soundEnabled,
    }))
  }, [])

  const toggleNotifications = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      notificationsEnabled: !prev.notificationsEnabled,
    }))
  }, [])

  const progressPercentage = () => {
    let totalTime
    if (mode === "pomodoro") {
      totalTime = settings.pomodoro * 60
    } else if (mode === "shortBreak") {
      totalTime = settings.shortBreak * 60
    } else {
      totalTime = settings.longBreak * 60
    }

    return 100 - (timeLeft / totalTime) * 100
  }

  const testSound = useCallback(() => {
    playSound()
    toast({
      title: "Testing sound",
      description: "If you don't hear anything, check your volume settings",
    })
  }, [playSound, toast])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Pomodoro Timer</h2>
        <p className="text-muted-foreground">Stay focused with timed work sessions and breaks</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Timer</CardTitle>
            <CardDescription>Focus on your work in timed intervals</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Tabs defaultValue="pomodoro" className="w-full mb-6" value={mode} onValueChange={setMode}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
                <TabsTrigger value="shortBreak">Short Break</TabsTrigger>
                <TabsTrigger value="longBreak">Long Break</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-6xl font-bold mb-8">{formatTime(timeLeft)}</div>

            <Progress value={progressPercentage()} className="w-full h-2 mb-8" />

            <div className="flex gap-4">
              <Button size="lg" onClick={toggleTimer}>
                {isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isActive ? "Pause" : "Start"}
              </Button>
              <Button size="lg" variant="outline" onClick={resetTimer}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleSound}>
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="ghost" onClick={toggleNotifications}>
                {settings.notificationsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="text-sm text-muted-foreground">Completed today: {completedPomodoros} pomodoros</div>
            <div className="text-sm text-muted-foreground">{mode === "pomodoro" ? "Focus time" : "Break time"}</div>
          </CardFooter>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Customize your timer preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Pomodoro Length</label>
                <span className="text-sm text-muted-foreground">{settings.pomodoro} minutes</span>
              </div>
              <Slider
                value={[settings.pomodoro]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value) => updateSetting("pomodoro", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Short Break Length</label>
                <span className="text-sm text-muted-foreground">{settings.shortBreak} minutes</span>
              </div>
              <Slider
                value={[settings.shortBreak]}
                min={1}
                max={15}
                step={1}
                onValueChange={(value) => updateSetting("shortBreak", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Long Break Length</label>
                <span className="text-sm text-muted-foreground">{settings.longBreak} minutes</span>
              </div>
              <Slider
                value={[settings.longBreak]}
                min={5}
                max={30}
                step={5}
                onValueChange={(value) => updateSetting("longBreak", value[0])}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-sm text-muted-foreground">{settings.volume}%</span>
              </div>
              <Slider
                value={[settings.volume]}
                min={0}
                max={100}
                step={10}
                disabled={!settings.soundEnabled}
                onValueChange={(value) => updateSetting("volume", value[0])}
              />
              {settings.soundEnabled && (
                <Button variant="outline" size="sm" onClick={testSound} className="mt-2">
                  Test Sound
                </Button>
              )}
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Notifications</Label>
                  <div className="text-xs text-muted-foreground">Get notified when timer completes</div>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notificationsEnabled}
                  onCheckedChange={toggleNotifications}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auto-start Breaks</Label>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(checked) => updateSetting("autoStartBreaks", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Auto-start Pomodoros</Label>
                <Switch
                  checked={settings.autoStartPomodoros}
                  onCheckedChange={(checked) => updateSetting("autoStartPomodoros", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
