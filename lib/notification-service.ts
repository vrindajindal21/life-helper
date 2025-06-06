// Enhanced notification service with better browser compatibility
export class NotificationService {
  private static permissionState: NotificationPermission = "default"
  private static initialized = false
  private static audioContext: AudioContext | null = null

  private static soundPresets = {
    default: { frequency: 440, duration: 0.5, type: "sine" },
    medication: { frequency: 830, duration: 1.5, type: "sine" },
    task: { frequency: 700, duration: 0.8, type: "triangle" },
    habit: { frequency: 600, duration: 0.6, type: "sine" },
    timer: { frequency: 800, duration: 0.3, type: "square" },
    goal: { frequency: 550, duration: 1.0, type: "sine" },
    urgent: { frequency: 880, duration: 0.2, repeat: 3, type: "sawtooth" },
    bell: { frequency: 830, duration: 1.5, type: "sine" },
    beep: { frequency: 800, duration: 0.3, type: "square" },
    chime: { frequency: 1000, duration: 1.0, type: "sine" },
    health: { frequency: 650, duration: 0.7, type: "sine" },
  }

  static async initialize() {
    if (typeof window !== "undefined" && !this.initialized) {
      this.initialized = true

      if ("Notification" in window) {
        this.permissionState = Notification.permission
        console.log("Initial notification permission:", this.permissionState)

        // Register service worker for background notifications
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.register("/sw.js")
            console.log("ServiceWorker registration successful")
          } catch (err) {
            console.log("ServiceWorker registration failed:", err)
          }
        }
      }

      // Initialize audio context
      this.initializeAudioContext()
    }
  }

  private static initializeAudioContext() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        this.audioContext = new AudioContext()
        console.log("Audio context initialized")
      }
    } catch (error) {
      console.error("Failed to initialize audio context:", error)
    }
  }

  static isSupported() {
    return typeof window !== "undefined" && "Notification" in window
  }

  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.log("Notifications not supported")
      return "denied"
    }

    // Check current permission
    const currentPermission = Notification.permission
    console.log("Current permission:", currentPermission)

    if (currentPermission === "granted") {
      this.permissionState = "granted"
      return "granted"
    }

    if (currentPermission === "denied") {
      this.permissionState = "denied"
      return "denied"
    }

    try {
      console.log("Requesting notification permission...")

      // Create a user interaction to ensure the request works
      const permission = await new Promise<NotificationPermission>((resolve) => {
        // Use the callback-based API for better compatibility
        if (typeof Notification.requestPermission === "function") {
          const result = Notification.requestPermission((perm) => {
            resolve(perm)
          })

          // If it returns a promise (modern browsers), handle that too
          if (result && typeof result.then === "function") {
            result.then(resolve).catch(() => resolve("denied"))
          }
        } else {
          resolve("denied")
        }
      })

      this.permissionState = permission
      console.log("Permission result:", permission)

      // Update the global permission state
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("notificationPermissionChanged", {
            detail: { permission },
          }),
        )
      }

      return permission
    } catch (error) {
      console.error("Error requesting notification permission:", error)
      this.permissionState = "denied"
      return "denied"
    }
  }

  static show(options: { title: string; body?: string; icon?: string; tag?: string }) {
    console.log("Attempting to show notification:", options)

    // Always play sound first
    this.playSound("default", 70)

    // Check permission again before showing
    const currentPermission = Notification.permission
    this.permissionState = currentPermission

    // Show browser notification if permission granted
    if (currentPermission === "granted") {
      try {
        const notification = new Notification(options.title, {
          body: options.body || "",
          icon: options.icon || "/favicon.ico",
          badge: "/favicon.ico",
          tag: options.tag || "default",
          requireInteraction: false,
          silent: false,
        })

        notification.onclick = () => {
          window.focus()
          notification.close()
        }

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close()
        }, 5000)

        console.log("Notification shown successfully")
        return notification
      } catch (error) {
        console.error("Error showing notification:", error)
      }
    } else {
      console.log("Notification permission not granted:", currentPermission)
    }

    // Always show in-app notification as fallback
    this.showInAppNotification(options.title, options)
    return null
  }

  static showNotification(
    title: string,
    options: any = {},
    soundType: keyof typeof this.soundPresets = "default",
    volume = 70,
  ) {
    return this.show({
      title,
      body: options.body || options.description || "",
      icon: options.icon || "/favicon.ico",
      tag: options.tag || "default",
    })
  }

  static playSound(soundType: keyof typeof this.soundPresets = "default", volume = 70): boolean {
    try {
      if (!this.audioContext) {
        this.initializeAudioContext()
      }

      if (!this.audioContext) {
        console.log("Audio context not available")
        return false
      }

      const preset = this.soundPresets[soundType] || this.soundPresets.default
      const context = this.audioContext

      if (context.state === "suspended") {
        context.resume()
      }

      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.type = preset.type as OscillatorType
      oscillator.frequency.value = preset.frequency

      const normalizedVolume = Math.max(0, Math.min(1, volume / 100))
      gainNode.gain.value = normalizedVolume

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      const now = context.currentTime
      gainNode.gain.setValueAtTime(normalizedVolume, now)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + preset.duration)

      oscillator.start(now)
      oscillator.stop(now + preset.duration)

      return true
    } catch (error) {
      console.error("Error playing sound:", error)
      return false
    }
  }

  static getPermissionState() {
    return this.permissionState
  }

  static showInAppNotification(title: string, options: any = {}) {
    const event = new CustomEvent("inAppNotification", {
      detail: { title, options },
    })
    window.dispatchEvent(event)
    return true
  }
}

// Auto-initialize
if (typeof window !== "undefined") {
  NotificationService.initialize()
}
