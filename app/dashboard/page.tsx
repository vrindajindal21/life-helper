"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, CheckSquare, Calendar, BarChart, ArrowRight } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { WeatherWidget } from "@/components/weather-widget"
import { AiSuggestions } from "@/components/ai-suggestions"
import { useLanguage } from "@/components/language-provider"

export default function DashboardPage() {
  const { toast } = useToast()
  const { t } = useLanguage()
  const [upcomingTasks, setUpcomingTasks] = useState([
    { id: 1, title: "Math Assignment", dueDate: "2025-03-25", completed: false, priority: "high" },
    { id: 2, title: "Physics Lab Report", dueDate: "2025-03-28", completed: false, priority: "medium" },
    { id: 3, title: "Literature Essay", dueDate: "2025-04-02", completed: false, priority: "medium" },
  ])
  const [upcomingEvents, setUpcomingEvents] = useState([
    { id: 1, title: "Math Lecture", date: "2025-03-23", time: "10:00 AM", location: "Room 101" },
    { id: 2, title: "Group Study Session", date: "2025-03-24", time: "2:00 PM", location: "Library" },
    { id: 3, title: "Physics Lab", date: "2025-03-26", time: "1:00 PM", location: "Science Building" },
  ])
  const [studyStats, setStudyStats] = useState({
    todayMinutes: 120,
    weekMinutes: 540,
    monthMinutes: 2160,
    goalMinutes: 180,
  })
  const [habits, setHabits] = useState([
    { id: 1, name: "Read 30 minutes", completed: true, streak: 5 },
    { id: 2, name: "Exercise", completed: false, streak: 3 },
    { id: 3, name: "Drink water", completed: true, streak: 7 },
  ])

  const [isMounted, setIsMounted] = useState(false)
  const [dataInitialized, setDataInitialized] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load data from localStorage
  useEffect(() => {
    if (isMounted && !dataInitialized) {
      // Load tasks
      const savedTasks = localStorage.getItem("tasks")
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks)
        // Get upcoming incomplete tasks
        const upcoming = parsedTasks
          .filter((task) => !task.completed)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 3)

        if (upcoming.length > 0) {
          setUpcomingTasks(upcoming)
        }
      }

      // Load events
      const savedEvents = localStorage.getItem("events")
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        // Get upcoming events
        const upcoming = parsedEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3)

        if (upcoming.length > 0) {
          setUpcomingEvents(upcoming)
        }
      }

      // Load habits
      const savedHabits = localStorage.getItem("habits")
      if (savedHabits) {
        const parsedHabits = JSON.parse(savedHabits)
        if (parsedHabits.length > 0) {
          setHabits(parsedHabits.slice(0, 3))
        }
      }

      // Load study stats
      const savedSessions = localStorage.getItem("studySessions")
      if (savedSessions) {
        const parsedSessions = JSON.parse(savedSessions)

        // Calculate study stats
        const today = new Date()
        const todaySessions = parsedSessions.filter(
          (session) => new Date(session.date).toDateString() === today.toDateString(),
        )

        const weekStart = new Date()
        weekStart.setDate(today.getDate() - today.getDay())
        const weekSessions = parsedSessions.filter((session) => new Date(session.date) >= weekStart)

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
        const monthSessions = parsedSessions.filter((session) => new Date(session.date) >= monthStart)

        const todayMinutes = todaySessions.reduce((total, session) => total + session.duration, 0)
        const weekMinutes = weekSessions.reduce((total, session) => total + session.duration, 0)
        const monthMinutes = monthSessions.reduce((total, session) => total + session.duration, 0)

        if (parsedSessions.length > 0) {
          setStudyStats({
            todayMinutes: todayMinutes || 120,
            weekMinutes: weekMinutes || 540,
            monthMinutes: monthMinutes || 2160,
            goalMinutes: 180,
          })
        }
      }

      setDataInitialized(true)
    }
  }, [isMounted, dataInitialized])

  const completeTask = (id) => {
    setUpcomingTasks((tasks) => tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)))
    toast({
      title: "Task updated",
      description: "Your task status has been updated.",
    })
  }

  const completeHabit = (id) => {
    setHabits((habits) =>
      habits.map((habit) =>
        habit.id === id
          ? { ...habit, completed: !habit.completed, streak: habit.completed ? habit.streak - 1 : habit.streak + 1 }
          : habit,
      ),
    )
    toast({
      title: "Habit tracked",
      description: "Your habit has been tracked for today.",
    })
  }

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h2>
          <p className="text-muted-foreground">{t("welcomeBack")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">{t("overview")}</TabsTrigger>
              <TabsTrigger value="tasks">{t("tasks")}</TabsTrigger>
              <TabsTrigger value="schedule">{t("schedule")}</TabsTrigger>
              <TabsTrigger value="habits">{t("habits")}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("studyTimeToday")}</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.floor(studyStats.todayMinutes / 60)}h {studyStats.todayMinutes % 60}m
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {studyStats.todayMinutes < studyStats.goalMinutes
                        ? `${studyStats.goalMinutes - studyStats.todayMinutes} ${t("minutesToGoal")}`
                        : "Daily goal reached!"}
                    </p>
                    <Progress value={(studyStats.todayMinutes / studyStats.goalMinutes) * 100} className="mt-2" />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("pendingTasks")}</CardTitle>
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingTasks.filter((t) => !t.completed).length}</div>
                    <p className="text-xs text-muted-foreground">
                      {upcomingTasks.filter((t) => !t.completed && t.priority === "high").length} {t("highPriority")}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("upcomingEvents")}</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingEvents.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Next: {upcomingEvents[0]?.title} ({upcomingEvents[0]?.date})
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{t("weeklyProgress")}</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {Math.round((studyStats.weekMinutes / (7 * studyStats.goalMinutes)) * 100)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.floor(studyStats.weekMinutes / 60)}h {studyStats.weekMinutes % 60}m this week
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>{t("upcomingTasks")}</CardTitle>
                    <CardDescription>{t("pendingAssignments")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => completeTask(task.id)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                              {task.title}
                            </span>
                            {task.priority === "high" && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                                High
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">Due: {task.dueDate}</span>
                        </div>
                      ))}
                      <Link href="/dashboard/tasks">
                        <Button variant="ghost" className="w-full mt-2">
                          View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>{t("todaySchedule")}</CardTitle>
                    <CardDescription>{t("eventsAndClasses")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {upcomingEvents.slice(0, 3).map((event) => (
                        <div key={event.id} className="flex flex-col p-2 border rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{event.title}</span>
                            <span className="text-sm text-muted-foreground">{event.time}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">{event.location}</div>
                        </div>
                      ))}
                      <Link href="/dashboard/timetable">
                        <Button variant="ghost" className="w-full mt-2">
                          View Full Schedule <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Manage your assignments and personal tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={() => completeTask(task.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                          {task.priority === "high" && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                              High
                            </span>
                          )}
                          {task.priority === "medium" && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                              Medium
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">Due: {task.dueDate}</span>
                      </div>
                    ))}
                    <Link href="/dashboard/tasks">
                      <Button variant="outline" className="w-full mt-2">
                        Add New Task <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Your classes, meetings, and events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className="flex flex-col p-3 border rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{event.title}</span>
                          <span className="text-sm text-muted-foreground">
                            {event.date} at {event.time}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Location: {event.location}</div>
                      </div>
                    ))}
                    <Link href="/dashboard/timetable">
                      <Button variant="outline" className="w-full mt-2">
                        Manage Schedule <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="habits" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Habits</CardTitle>
                  <CardDescription>Track your daily habits and build streaks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {habits.map((habit) => (
                      <div key={habit.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={habit.completed}
                            onChange={() => completeHabit(habit.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className={habit.completed ? "text-muted-foreground" : ""}>{habit.name}</span>
                        </div>
                        <span className="text-sm font-medium">{habit.streak} day streak</span>
                      </div>
                    ))}
                    <Link href="/dashboard/habits">
                      <Button variant="outline" className="w-full mt-2">
                        View All Habits <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <WeatherWidget />
          <AiSuggestions tasks={upcomingTasks} habits={habits} studySessions={[]} goals={[]} />
          <Card>
            <CardHeader>
              <CardTitle>Medicine Reminders</CardTitle>
              <CardDescription>Your upcoming medication schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/dashboard/medications">
                  <Button variant="outline" className="w-full">
                    View Medications <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
