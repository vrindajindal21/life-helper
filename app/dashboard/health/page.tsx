"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Activity,
  Heart,
  Droplets,
  Moon,
  Scale,
  Footprints,
  Flame,
  Dumbbell,
  Plus,
  TrendingUp,
  Target,
  Clock,
  MapPin,
  Play,
  Pause,
} from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { HealthTracker } from "@/lib/health-tracker"
import { NotificationService } from "@/lib/notification-service"

interface HealthData {
  steps: number
  stepGoal: number
  water: number
  waterGoal: number
  sleep: number
  sleepGoal: number
  weight: number
  heartRate: number
  calories: number
  calorieGoal: number
  distance: number
  exercises: Exercise[]
  autoTracking: boolean
}

interface Exercise {
  id: string
  name: string
  duration: number
  calories: number
  type: string
  timestamp: Date
}

export default function HealthTrackerPage() {
  const { t } = useLanguage()
  const [healthData, setHealthData] = useState<HealthData>({
    steps: 0,
    stepGoal: 10000,
    water: 0,
    waterGoal: 8,
    sleep: 0,
    sleepGoal: 8,
    weight: 0,
    heartRate: 0,
    calories: 0,
    calorieGoal: 2000,
    distance: 0,
    exercises: [],
    autoTracking: false,
  })

  const [newExercise, setNewExercise] = useState({
    name: "",
    duration: "",
    calories: "",
    type: "cardio",
  })

  const [isAddExerciseOpen, setIsAddExerciseOpen] = useState(false)
  const [tracker] = useState(() => HealthTracker.getInstance())

  // Load health data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("health-data")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      parsed.exercises = parsed.exercises.map((ex: any) => ({
        ...ex,
        timestamp: new Date(ex.timestamp),
      }))
      setHealthData(parsed)
    }

    // Listen for automatic health data updates
    const handleHealthUpdate = (event: CustomEvent) => {
      const autoData = event.detail
      setHealthData((prev) => ({
        ...prev,
        steps: autoData.steps,
        distance: autoData.distance / 1000, // Convert to km
        calories: prev.calories + autoData.calories,
      }))
    }

    window.addEventListener("healthDataUpdate", handleHealthUpdate as EventListener)

    return () => {
      window.removeEventListener("healthDataUpdate", handleHealthUpdate as EventListener)
    }
  }, [])

  // Save health data to localStorage
  useEffect(() => {
    localStorage.setItem("health-data", JSON.stringify(healthData))
  }, [healthData])

  // Auto-tracking toggle
  const toggleAutoTracking = async () => {
    if (!healthData.autoTracking) {
      const success = await tracker.startTracking()
      if (success) {
        setHealthData((prev) => ({ ...prev, autoTracking: true }))
        NotificationService.showNotification(
          "Auto Tracking Started",
          {
            body: "Your steps, distance, and calories are now being tracked automatically.",
            icon: "/favicon.ico",
          },
          "default",
          70,
        )
      }
    } else {
      tracker.stopTracking()
      setHealthData((prev) => ({ ...prev, autoTracking: false }))
    }
  }

  const addWater = () => {
    setHealthData((prev) => ({
      ...prev,
      water: Math.min(prev.water + 1, prev.waterGoal + 5),
    }))
  }

  const addSteps = (steps: number) => {
    setHealthData((prev) => ({
      ...prev,
      steps: prev.steps + steps,
      calories: prev.calories + Math.round(steps * 0.04),
    }))
  }

  const updateSleep = (hours: number) => {
    setHealthData((prev) => ({
      ...prev,
      sleep: hours,
    }))
  }

  const updateWeight = (weight: number) => {
    setHealthData((prev) => ({
      ...prev,
      weight: weight,
    }))
  }

  const updateHeartRate = (rate: number) => {
    setHealthData((prev) => ({
      ...prev,
      heartRate: rate,
    }))
  }

  const addExercise = () => {
    if (!newExercise.name || !newExercise.duration) return

    const exercise: Exercise = {
      id: Date.now().toString(),
      name: newExercise.name,
      duration: Number.parseInt(newExercise.duration),
      calories: Number.parseInt(newExercise.calories) || 0,
      type: newExercise.type,
      timestamp: new Date(),
    }

    setHealthData((prev) => ({
      ...prev,
      exercises: [exercise, ...prev.exercises],
      calories: prev.calories + exercise.calories,
    }))

    setNewExercise({ name: "", duration: "", calories: "", type: "cardio" })
    setIsAddExerciseOpen(false)
  }

  const getStepProgress = () => (healthData.steps / healthData.stepGoal) * 100
  const getWaterProgress = () => (healthData.water / healthData.waterGoal) * 100
  const getSleepProgress = () => (healthData.sleep / healthData.sleepGoal) * 100
  const getCalorieProgress = () => (healthData.calories / healthData.calorieGoal) * 100

  const getTodayExercises = () => {
    const today = new Date()
    return healthData.exercises.filter((ex) => {
      const exDate = new Date(ex.timestamp)
      return exDate.toDateString() === today.toDateString()
    })
  }

  const getTotalExerciseTime = () => {
    return getTodayExercises().reduce((total, ex) => total + ex.duration, 0)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("health")}</h1>
          <p className="text-muted-foreground">Track your daily health and fitness metrics automatically</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center space-x-2">
            <Switch id="auto-tracking" checked={healthData.autoTracking} onCheckedChange={toggleAutoTracking} />
            <Label htmlFor="auto-tracking" className="flex items-center gap-2">
              {healthData.autoTracking ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              {t("autoTracking")}
            </Label>
          </div>
          <Dialog open={isAddExerciseOpen} onOpenChange={setIsAddExerciseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t("add")} {t("exercise")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("add")} {t("exercise")}
                </DialogTitle>
                <DialogDescription>Log your workout or physical activity</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exercise-name" className="text-right">
                    {t("exercise")}
                  </Label>
                  <Input
                    id="exercise-name"
                    value={newExercise.name}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, name: e.target.value }))}
                    className="col-span-3"
                    placeholder="e.g., Running, Push-ups"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exercise-duration" className="text-right">
                    Duration (min)
                  </Label>
                  <Input
                    id="exercise-duration"
                    type="number"
                    value={newExercise.duration}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, duration: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exercise-calories" className="text-right">
                    {t("calories")}
                  </Label>
                  <Input
                    id="exercise-calories"
                    type="number"
                    value={newExercise.calories}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, calories: e.target.value }))}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="exercise-type" className="text-right">
                    Type
                  </Label>
                  <select
                    id="exercise-type"
                    value={newExercise.type}
                    onChange={(e) => setNewExercise((prev) => ({ ...prev, type: e.target.value }))}
                    className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="cardio">Cardio</option>
                    <option value="strength">Strength</option>
                    <option value="flexibility">Flexibility</option>
                    <option value="sports">Sports</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addExercise}>
                  {t("add")} {t("exercise")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {healthData.autoTracking && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Activity className="h-5 w-5" />
              <span className="font-medium">Auto Tracking Active</span>
              <Badge variant="secondary" className="ml-auto">
                Live
              </Badge>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Your steps, distance, and calories are being tracked automatically using device sensors.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("todaySteps")}</CardTitle>
                <Footprints className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.steps.toLocaleString()}</div>
                <Progress value={getStepProgress()} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Goal: {healthData.stepGoal.toLocaleString()} steps</p>
                {healthData.autoTracking && (
                  <Badge variant="outline" className="mt-2">
                    Auto Tracked
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("distance")}</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.distance.toFixed(2)} km</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {(healthData.distance * 0.621371).toFixed(2)} miles
                </p>
                {healthData.autoTracking && (
                  <Badge variant="outline" className="mt-2">
                    GPS Tracked
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("waterGoal")}</CardTitle>
                <Droplets className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthData.water}/{healthData.waterGoal}
                </div>
                <Progress value={getWaterProgress()} className="mt-2" />
                <Button size="sm" onClick={addWater} className="mt-2">
                  <Plus className="h-3 w-3 mr-1" />
                  Add Glass
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("calories")}</CardTitle>
                <Flame className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthData.calories}</div>
                <Progress value={getCalorieProgress()} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Goal: {healthData.calorieGoal} cal</p>
                {healthData.autoTracking && (
                  <Badge variant="outline" className="mt-2">
                    Auto Calculated
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  {t("heartRate")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{healthData.heartRate} BPM</div>
                <Input
                  type="number"
                  placeholder="Enter heart rate"
                  className="mt-2"
                  onChange={(e) => updateHeartRate(Number.parseInt(e.target.value) || 0)}
                />
                <div className="mt-2">
                  <Badge variant={healthData.heartRate > 100 ? "destructive" : "secondary"}>
                    {healthData.heartRate > 100 ? "High" : "Normal"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  {t("currentWeight")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{healthData.weight} kg</div>
                <Input
                  type="number"
                  placeholder="Enter weight"
                  className="mt-2"
                  onChange={(e) => updateWeight(Number.parseFloat(e.target.value) || 0)}
                />
                <p className="text-xs text-muted-foreground mt-1">Last updated: {new Date().toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Activity
              </CardTitle>
              <CardDescription>Total exercise time: {getTotalExerciseTime()} minutes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getTodayExercises().length === 0 ? (
                  <p className="text-muted-foreground">No exercises logged today</p>
                ) : (
                  getTodayExercises().map((exercise) => (
                    <div key={exercise.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Dumbbell className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{exercise.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {exercise.duration} min • {exercise.calories} cal
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{exercise.type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("manualEntry")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button size="sm" onClick={() => addSteps(1000)} className="w-full">
                  +1,000 steps
                </Button>
                <Button size="sm" onClick={() => addSteps(2500)} className="w-full">
                  +2,500 steps
                </Button>
                <Button size="sm" onClick={() => addSteps(5000)} className="w-full">
                  +5,000 steps
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Activity Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t("steps")}</span>
                    <span>{Math.round(getStepProgress())}%</span>
                  </div>
                  <Progress value={getStepProgress()} />
                  <div className="flex justify-between text-sm">
                    <span>{t("exercise")}</span>
                    <span>{getTotalExerciseTime()}/30 min</span>
                  </div>
                  <Progress value={(getTotalExerciseTime() / 30) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Weekly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Avg Steps/Day</span>
                    <span>{Math.round(healthData.steps / 7).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total Exercise</span>
                    <span>{getTotalExerciseTime() * 7} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Calories Burned</span>
                    <span>{healthData.calories * 7}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  {t("water")} Intake
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {healthData.water}/{healthData.waterGoal} glasses
                </div>
                <Progress value={getWaterProgress()} className="mb-4" />
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={addWater} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Glass
                  </Button>
                  <Button
                    onClick={() => setHealthData((prev) => ({ ...prev, water: Math.max(0, prev.water - 1) }))}
                    variant="outline"
                    size="sm"
                  >
                    Remove Glass
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="h-5 w-5" />
                  Calorie Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {healthData.calories}/{healthData.calorieGoal} cal
                </div>
                <Progress value={getCalorieProgress()} className="mb-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>From Activity</span>
                    <span>{healthData.calories} cal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Remaining</span>
                    <span>{Math.max(0, healthData.calorieGoal - healthData.calories)} cal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sleep" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                {t("sleep")} Tracking
              </CardTitle>
              <CardDescription>Track your sleep patterns and quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="sleep-hours">{t("sleepHours")} Last Night</Label>
                  <Input
                    id="sleep-hours"
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={healthData.sleep}
                    onChange={(e) => updateSleep(Number.parseFloat(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Sleep Goal</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="1"
                    max="12"
                    value={healthData.sleepGoal}
                    onChange={(e) =>
                      setHealthData((prev) => ({ ...prev, sleepGoal: Number.parseFloat(e.target.value) || 8 }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Sleep Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {healthData.sleep}h / {healthData.sleepGoal}h
                  </span>
                </div>
                <Progress value={getSleepProgress()} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{healthData.sleep}h</div>
                  <div className="text-sm text-muted-foreground">Last Night</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{healthData.sleepGoal}h</div>
                  <div className="text-sm text-muted-foreground">Goal</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-2xl font-bold">{healthData.sleep >= healthData.sleepGoal ? "✓" : "−"}</div>
                  <div className="text-sm text-muted-foreground">
                    {healthData.sleep >= healthData.sleepGoal ? "Goal Met" : "Below Goal"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
