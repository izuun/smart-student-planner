self.addEventListener("push", (event) => {
  let data = { title: "Smart Student Planner", body: "You have a task update." };

  try {
    data = event.data.json();
  } catch (e) {
    // fall back to default text above if payload isn't JSON
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: data.url || "/tasks" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/tasks";
  event.waitUntil(clients.openWindow(url));
});
