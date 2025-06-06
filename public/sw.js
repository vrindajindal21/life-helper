// Enhanced Service Worker for background notifications
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

// Handle push notifications
self.addEventListener("push", (event) => {
  let data = { title: "Notification", body: "You have a new notification" }

  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch (e) {
    console.error("Error parsing push data", e)
  }

  const options = {
    body: data.body || "Notification",
    icon: data.icon || "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || "notification",
    requireInteraction: true,
    data: data.data || {},
    actions: [
      {
        action: "dismiss",
        title: "Dismiss",
      },
      {
        action: "open",
        title: "Open App",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(data.title || "Notification", options))
})

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const rootUrl = new URL("/", self.location.origin).href
  let targetUrl = rootUrl

  // Check if we have a specific URL to navigate to
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url
  } else if (event.action === "open" || event.action === "") {
    // Default action is to open the app
    if (event.notification.tag) {
      // Route based on notification type
      if (event.notification.tag.includes("medication")) {
        targetUrl = "/dashboard/medications"
      } else if (event.notification.tag.includes("task")) {
        targetUrl = "/dashboard/tasks"
      } else if (event.notification.tag.includes("habit")) {
        targetUrl = "/dashboard/habits"
      } else if (event.notification.tag.includes("goal")) {
        targetUrl = "/dashboard/goals"
      } else if (event.notification.tag.includes("timer")) {
        targetUrl = "/dashboard/pomodoro"
      } else if (event.notification.tag.includes("reminder")) {
        targetUrl = "/dashboard/reminders"
      }
    }
  }

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If a window client is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    }),
  )
})

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  // You can track when users dismiss notifications here
  console.log("Notification closed", event.notification.tag)
})

// Periodic sync for regular checks (medication reminders, etc.)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    event.waitUntil(checkReminders())
  }
})

// Function to check for reminders
async function checkReminders() {
  try {
    // Fetch reminders from your API or cache
    const response = await fetch("/api/reminders/check")
    const reminders = await response.json()

    // Show notifications for due reminders
    reminders.forEach((reminder) => {
      self.registration.showNotification(reminder.title, {
        body: reminder.description,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        vibrate: [200, 100, 200],
        tag: `reminder-${reminder.id}`,
        requireInteraction: true,
        data: { url: reminder.url },
      })
    })
  } catch (error) {
    console.error("Error checking reminders:", error)
  }
}
