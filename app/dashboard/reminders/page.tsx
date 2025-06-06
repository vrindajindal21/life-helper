"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Plus, Trash2, Volume2, X, CalendarIcon, Clock } from "lucide-react"

const colors = [
  { label: "Red", value: "red-500", color: "bg-red-500" },
  { label: "Blue", value: "blue-500", color: "bg-blue-500" },
  { label: "Green", value: "green-500", color: "bg-green-500" },
  { label: "Yellow", value: "yellow-500", color: "bg-yellow-500" },
  { label: "Purple", value: "purple-500", color: "bg-purple-500" },
  { label: "Pink", value: "pink-500", color: "bg-pink-500" },
  { label: "Orange", value: "orange-500", color: "bg-orange-500" },
  { label: "Teal", value: "teal-500", color: "bg-teal-500" },
]

const categories = [
  { label: "Medication", value: "medication" },
  { label: "Personal", value: "personal" },
  { label: "Work", value: "work" },
  { label: "Health", value: "health" },
  { label: "Finance", value: "finance" },
  { label: "Education", value: "education" },
  { label: "Shopping", value: "shopping" },
]

const sounds = [
  { label: "Bell", value: "bell" },
  { label: "Chime", value: "chime" },
  { label: "Ding", value: "ding" },
  { label: "Electronic", value: "electronic" },
  { label: "Morse Code", value: "morse_code" },
]

const daysOfWeek = [
  { label: "Mon", value: "monday" },
  { label: "Tue", value: "tuesday" },
  { label: "Wed", value: "wednesday" },
  { label: "Thu", value: "thursday" },
  { label: "Fri", value: "friday" },
  { label: "Sat", value: "saturday" },
  { label: "Sun", value: "sunday" },
]

const RemindersPage = () => {
  const router = useRouter()
  const [reminders, setReminders] = useState([])
  const [newReminder, setNewReminder] = useState({
    id: null,
    title: "",
    description: "",
    category: "medication",
    color: "blue-500",
    startDate: new Date(),
    endDate: null,
    scheduleTimes: [
      { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    ],
    isCompleted: false,
    sound: "bell",
    volume: 70,
    notificationsEnabled: true,
    soundEnabled: true,
  })
  const [selectedReminder, setSelectedReminder] = useState(null)
  const [isAddingReminder, setIsAddingReminder] = useState(false)
  const [isEditingReminder, setIsEditingReminder] = useState(false)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission)
  const [isRecording, setIsRecording] = useState(false)
  const [voiceInput, setVoiceInput] = useState("")
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [audioChunks, setAudioChunks] = useState([])
  const audioRef = useRef(null)
  const [editingReminder, setEditingReminder] = useState({
    id: null,
    title: "",
    description: "",
    category: "medication",
    color: "blue-500",
    startDate: new Date(),
    endDate: null,
    scheduleTimes: [
      { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
    ],
    isCompleted: false,
    sound: "bell",
    volume: 70,
    notificationsEnabled: true,
    soundEnabled: true,
  })

  useEffect(() => {
    const storedReminders = localStorage.getItem("reminders")
    if (storedReminders) {
      setReminders(JSON.parse(storedReminders))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("reminders", JSON.stringify(reminders))
    router.refresh()
  }, [reminders, router])

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setNotificationPermission(permission)
        })
      } else {
        setNotificationPermission(Notification.permission)
      }
    }
  }, [])

  const playSound = (soundFile) => {
    if (audioRef.current) {
      const audioSrc = `/sounds/${soundFile}.mp3`
      if (audioRef.current.src !== audioSrc) {
        audioRef.current.src = audioSrc
      }
      audioRef.current.volume = newReminder.volume / 100
      audioRef.current.play().catch((error) => {
        console.error("Playback failed:", error)
      })
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      setMediaRecorder(recorder)
      setAudioChunks([])

      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data])
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setVoiceInput(audioUrl)
      }

      recorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
    }
  }

  const addReminder = () => {
    if (!newReminder.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive",
      })
      return
    }

    const newId = Math.random().toString(36).substring(7)
    const reminderToAdd = { ...newReminder, id: newId }
    setReminders([...reminders, reminderToAdd])
    setIsAddingReminder(false)
    setNewReminder({
      id: null,
      title: "",
      description: "",
      category: "medication",
      color: "blue-500",
      startDate: new Date(),
      endDate: null,
      scheduleTimes: [
        { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
      isCompleted: false,
      sound: "bell",
      volume: 70,
      notificationsEnabled: true,
      soundEnabled: true,
    })
    toast({
      title: "Success",
      description: "Reminder added successfully.",
    })
  }

  const updateReminder = () => {
    if (!editingReminder.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required.",
        variant: "destructive",
      })
      return
    }

    const updatedReminders = reminders.map((reminder) =>
      reminder.id === selectedReminder.id ? { ...editingReminder, id: selectedReminder.id } : reminder,
    )
    setReminders(updatedReminders)
    setIsEditingReminder(false)
    setSelectedReminder(null)
    toast({
      title: "Success",
      description: "Reminder updated successfully.",
    })
  }

  const deleteReminder = () => {
    const updatedReminders = reminders.filter((reminder) => reminder.id !== selectedReminder.id)
    setReminders(updatedReminders)
    setIsConfirmingDelete(false)
    setSelectedReminder(null)
    toast({
      title: "Success",
      description: "Reminder deleted successfully.",
    })
  }

  const toggleComplete = (id) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === id ? { ...reminder, isCompleted: !reminder.isCompleted } : reminder,
    )
    setReminders(updatedReminders)
  }

  const addScheduleTime = () => {
    setNewReminder({
      ...newReminder,
      scheduleTimes: [
        ...newReminder.scheduleTimes,
        { time: "08:00", days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] },
      ],
    })
  }

  const removeScheduleTime = (index) => {
    const newScheduleTimes = [...newReminder.scheduleTimes]
    newScheduleTimes.splice(index, 1)
    setNewReminder({ ...newReminder, scheduleTimes: newScheduleTimes })
  }

  const updateScheduleTime = (index, field, value) => {
    const newScheduleTimes = [...newReminder.scheduleTimes]
    newScheduleTimes[index] = { ...newScheduleTimes[index], [field]: value }
    setNewReminder({ ...newReminder, scheduleTimes: newScheduleTimes })
  }

  const toggleDay = (scheduleIndex, day) => {
    const newScheduleTimes = [...newReminder.scheduleTimes]
    const currentDays = newScheduleTimes[scheduleIndex].days
    if (currentDays.includes(day)) {
      newScheduleTimes[scheduleIndex].days = currentDays.filter((d) => d !== day)
    } else {
      newScheduleTimes[scheduleIndex].days = [...currentDays, day]
    }
    setNewReminder({ ...newReminder, scheduleTimes: newScheduleTimes })
  }

  const today = new Date()
  const todayReminders = reminders.filter((reminder) => {
    const reminderDate = new Date(reminder.startDate)
    return (
      reminderDate.getDate() === today.getDate() &&
      reminderDate.getMonth() === today.getMonth() &&
      reminderDate.getFullYear() === today.getFullYear()
    )
  })

  const upcomingReminders = reminders.filter((reminder) => {
    const reminderDate = new Date(reminder.startDate)
    return reminderDate > today
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
        <CardDescription>Manage your reminders and stay organized.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">All Reminders</h2>
          <Button onClick={() => setIsAddingReminder(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Reminder
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{reminder.title}</CardTitle>
                <Checkbox
                  checked={reminder.isCompleted}
                  onCheckedChange={() => toggleComplete(reminder.id)}
                  id={`reminder-${reminder.id}`}
                />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{reminder.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedReminder(reminder)
                      setEditingReminder({ ...reminder })
                      setIsEditingReminder(true)
                    }}
                  >
                    Edit
                  </Button>
                  <p className="text-xs text-gray-500">{format(new Date(reminder.startDate), "PPP")} </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-md font-semibold">Today's Reminders</h3>
            {todayReminders.length > 0 ? (
              todayReminders.map((reminder) => (
                <Card key={reminder.id} className="mb-2 bg-muted">
                  <CardContent>
                    <p className="text-sm">{reminder.title}</p>
                    <p className="text-xs text-gray-500">{format(new Date(reminder.startDate), "h:mm a")}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No reminders for today.</p>
            )}
          </div>

          <div>
            <h3 className="text-md font-semibold">Upcoming Reminders</h3>
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((reminder) => (
                <Card key={reminder.id} className="mb-2 bg-muted">
                  <CardContent>
                    <p className="text-sm">{reminder.title}</p>
                    <p className="text-xs text-gray-500">{format(new Date(reminder.startDate), "PPP h:mm a")}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming reminders.</p>
            )}
          </div>
        </div>

        <Dialog open={isAddingReminder} onOpenChange={setIsAddingReminder}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="flex flex-row items-center justify-between">
              <div>
                <DialogTitle>Add New Reminder</DialogTitle>
                <DialogDescription>Create a new reminder with notifications</DialogDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsAddingReminder(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <div className="relative">
                  <Input
                    id="title"
                    placeholder="Reminder title"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <div className="relative">
                  <Textarea
                    id="description"
                    placeholder="Additional details"
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    className="pr-10 min-h-[80px]"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 h-6 w-6"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newReminder.category}
                  onValueChange={(value) => setNewReminder({ ...newReminder, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Schedule */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Schedule</Label>
                  <Button variant="outline" size="sm" onClick={addScheduleTime}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Time
                  </Button>
                </div>

                {newReminder.scheduleTimes.map((schedule, index) => (
                  <div key={index} className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <Label>Time</Label>
                      </div>
                      {newReminder.scheduleTimes.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeScheduleTime(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={schedule.time}
                        onChange={(e) => updateScheduleTime(index, "time", e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">
                        {schedule.time.split(":")[0] > 12 ? "pm" : "am"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label>Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeek.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${index}-${day.value}`}
                              checked={schedule.days.includes(day.value)}
                              onCheckedChange={() => toggleDay(index, day.value)}
                            />
                            <Label htmlFor={`${index}-${day.value}`} className="text-sm">
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Start Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newReminder.startDate ? format(newReminder.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newReminder.startDate}
                        onSelect={(date) => setNewReminder({ ...newReminder, startDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newReminder.endDate ? format(newReminder.endDate, "PPP") : "No end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newReminder.endDate}
                        onSelect={(date) => setNewReminder({ ...newReminder, endDate: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex space-x-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      className={cn(
                        "w-8 h-8 rounded-full border-2",
                        color.color,
                        newReminder.color === color.value ? "border-gray-900 ring-2 ring-gray-300" : "border-gray-200",
                      )}
                      onClick={() => setNewReminder({ ...newReminder, color: color.value })}
                    />
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Get reminded when it's time</p>
                  </div>
                  <Switch
                    checked={newReminder.notificationsEnabled}
                    onCheckedChange={(checked) => setNewReminder({ ...newReminder, notificationsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound</Label>
                    <p className="text-sm text-muted-foreground">Play a sound when the reminder is due</p>
                  </div>
                  <Switch
                    checked={newReminder.soundEnabled}
                    onCheckedChange={(checked) => setNewReminder({ ...newReminder, soundEnabled: checked })}
                  />
                </div>

                {newReminder.soundEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Sound Type</Label>
                      <div className="flex space-x-2">
                        <Select
                          value={newReminder.sound}
                          onValueChange={(value) => setNewReminder({ ...newReminder, sound: value })}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sounds.map((sound) => (
                              <SelectItem key={sound.value} value={sound.value}>
                                {sound.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" onClick={() => playSound(newReminder.sound)}>
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Volume</Label>
                        <span className="text-sm text-muted-foreground">{newReminder.volume}%</span>
                      </div>
                      <Slider
                        value={[newReminder.volume]}
                        onValueChange={(value) => setNewReminder({ ...newReminder, volume: value[0] })}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <DialogFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsAddingReminder(false)}>
                Cancel
              </Button>
              <Button onClick={addReminder}>Add Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isConfirmingDelete} onOpenChange={setIsConfirmingDelete}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Delete Reminder</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this reminder? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteReminder}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <audio ref={audioRef} preload="none" />
    </Card>
  )
}

export default RemindersPage
