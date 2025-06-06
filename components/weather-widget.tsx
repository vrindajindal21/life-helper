"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Cloud, CloudRain, Sun, Wind, Snowflake, CloudLightning, Loader2, MapPin, RefreshCw } from "lucide-react"

export function WeatherWidget() {
  const { toast } = useToast()
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState({ lat: null, lon: null, name: "Getting location..." })

  // Fetch weather data using a real weather API simulation
  const fetchWeather = async (lat, lon) => {
    setLoading(true)
    setError(null)

    try {
      // In a real app, you would use: https://api.openweathermap.org/data/2.5/weather
      // For demo, we'll create realistic weather based on location and time

      await new Promise((resolve) => setTimeout(resolve, 800))

      // Get location name from coordinates (reverse geocoding simulation)
      let locationName = "Unknown Location"

      // Major cities coordinates for demo
      const cities = [
        { name: "New York, NY", lat: 40.7128, lon: -74.006 },
        { name: "London, UK", lat: 51.5074, lon: -0.1278 },
        { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
        { name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
        { name: "Mumbai, India", lat: 19.076, lon: 72.8777 },
        { name: "Los Angeles, CA", lat: 34.0522, lon: -118.2437 },
        { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
        { name: "Berlin, Germany", lat: 52.52, lon: 13.405 },
      ]

      // Find closest city or use coordinates
      const closest = cities.reduce((prev, curr) => {
        const prevDist = Math.abs(prev.lat - lat) + Math.abs(prev.lon - lon)
        const currDist = Math.abs(curr.lat - lat) + Math.abs(curr.lon - lon)
        return currDist < prevDist ? curr : prev
      })

      if (Math.abs(closest.lat - lat) < 1 && Math.abs(closest.lon - lon) < 1) {
        locationName = closest.name
      } else {
        locationName = `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`
      }

      // Generate realistic weather based on location and season
      const now = new Date()
      const month = now.getMonth() + 1 // 1-12
      const hour = now.getHours()

      let baseTemp = 20 // Default temperature
      let conditions = ["Clear", "Clouds", "Rain"]

      // Seasonal adjustments
      if (month >= 12 || month <= 2) {
        // Winter
        baseTemp = lat > 0 ? 5 : 25 // Northern hemisphere winter, Southern summer
        conditions = ["Clear", "Clouds", "Snow", "Windy"]
      } else if (month >= 6 && month <= 8) {
        // Summer
        baseTemp = lat > 0 ? 25 : 10 // Northern hemisphere summer, Southern winter
        conditions = ["Clear", "Clouds", "Thunderstorm"]
      }

      // Latitude adjustments (closer to equator = warmer)
      baseTemp += (30 - Math.abs(lat)) * 0.5

      // Time of day adjustments
      if (hour >= 6 && hour <= 18) {
        baseTemp += 5 // Daytime warmer
      } else {
        baseTemp -= 3 // Nighttime cooler
      }

      // Add some randomness
      const temperature = Math.round(baseTemp + (Math.random() - 0.5) * 10)
      const condition = conditions[Math.floor(Math.random() * conditions.length)]

      const mockWeatherData = {
        temperature,
        condition,
        humidity: Math.floor(Math.random() * 30) + 50,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        feelsLike: temperature + Math.floor((Math.random() - 0.5) * 6),
        sunrise: "06:45 AM",
        sunset: "07:30 PM",
        description: getWeatherDescription(condition, temperature),
      }

      setWeather(mockWeatherData)
      setLocation({ lat, lon, name: locationName })
      setLoading(false)
    } catch (err) {
      console.error("Error fetching weather:", err)
      setError("Failed to fetch weather data. Please try again.")
      setLoading(false)
    }
  }

  // Get weather description
  const getWeatherDescription = (condition, temp) => {
    const descriptions = {
      Clear: temp > 25 ? "Sunny and warm" : temp > 15 ? "Clear skies" : "Clear but cool",
      Clouds: temp > 20 ? "Partly cloudy" : "Overcast",
      Rain: temp > 15 ? "Light rain" : "Cold and rainy",
      Snow: "Snow expected",
      Thunderstorm: "Thunderstorms possible",
      Windy: "Windy conditions",
    }
    return descriptions[condition] || "Weather conditions"
  }

  // Get user location with improved error handling and faster fallback
  useEffect(() => {
    const getUserLocation = () => {
      if (navigator.geolocation) {
        // Try to get cached position first
        const cachedLocation = localStorage.getItem("userLocation")
        if (cachedLocation) {
          try {
            const { lat, lon, timestamp } = JSON.parse(cachedLocation)
            // Use cached location if it's less than 1 hour old
            if (Date.now() - timestamp < 60 * 60 * 1000) {
              fetchWeather(lat, lon)
              return
            }
          } catch (e) {
            console.log("Invalid cached location")
          }
        }

        // Set up a race between geolocation and timeout
        const timeoutId = setTimeout(() => {
          console.log("Geolocation timeout, using default location")
          const defaultLocation = { lat: 40.7128, lon: -74.006 } // New York
          setLocation({ ...defaultLocation, name: "New York, NY (Default)" })
          fetchWeather(defaultLocation.lat, defaultLocation.lon)
        }, 3000) // 3 second timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId)
            const { latitude, longitude } = position.coords

            // Cache the location
            localStorage.setItem(
              "userLocation",
              JSON.stringify({
                lat: latitude,
                lon: longitude,
                timestamp: Date.now(),
              }),
            )

            fetchWeather(latitude, longitude)
          },
          (error) => {
            clearTimeout(timeoutId)
            console.error("Geolocation error:", error)

            // Try IP-based location as fallback
            tryIPLocation()
          },
          {
            timeout: 2500, // Reduced timeout
            enableHighAccuracy: false, // Faster, less accurate
            maximumAge: 300000, // Cache for 5 minutes
          },
        )
      } else {
        // Geolocation not supported
        tryIPLocation()
      }
    }

    const tryIPLocation = async () => {
      try {
        // Try to get location from IP (simulated)
        const response = await fetch("https://ipapi.co/json/")
        if (response.ok) {
          const data = await response.json()
          if (data.latitude && data.longitude) {
            setLocation({ lat: data.latitude, lon: data.longitude, name: `${data.city}, ${data.country_name}` })
            fetchWeather(data.latitude, data.longitude)
            return
          }
        }
      } catch (e) {
        console.log("IP location failed, using default")
      }

      // Final fallback to default location
      const defaultLocation = { lat: 40.7128, lon: -74.006 }
      setLocation({ ...defaultLocation, name: "New York, NY (Default)" })
      fetchWeather(defaultLocation.lat, defaultLocation.lon)

      toast({
        title: "Location unavailable",
        description: "Using default location. Enable location access for accurate weather.",
        duration: 3000,
      })
    }

    getUserLocation()
  }, [])

  // Refresh weather data
  const handleRefresh = () => {
    if (location.lat && location.lon) {
      fetchWeather(location.lat, location.lon)
    }
  }

  // Get weather icon based on condition
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case "Clear":
        return <Sun className="h-10 w-10 text-yellow-500" />
      case "Clouds":
        return <Cloud className="h-10 w-10 text-gray-500" />
      case "Rain":
        return <CloudRain className="h-10 w-10 text-blue-500" />
      case "Snow":
        return <Snowflake className="h-10 w-10 text-blue-300" />
      case "Thunderstorm":
        return <CloudLightning className="h-10 w-10 text-purple-500" />
      case "Windy":
        return <Wind className="h-10 w-10 text-gray-400" />
      default:
        return <Cloud className="h-10 w-10 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Weather</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {location.name}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
            <p className="text-sm text-muted-foreground">Getting weather data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-sm text-red-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        ) : weather ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getWeatherIcon(weather.condition)}
              <div className="ml-4">
                <div className="text-3xl font-bold">{weather.temperature}°C</div>
                <div className="text-sm text-muted-foreground">Feels like {weather.feelsLike}°C</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{weather.condition}</div>
              <div className="text-xs text-muted-foreground">{weather.description}</div>
              <div className="text-xs text-muted-foreground">Humidity: {weather.humidity}%</div>
              <div className="text-xs text-muted-foreground">Wind: {weather.windSpeed} km/h</div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
