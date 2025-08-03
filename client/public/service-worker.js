/* eslint-disable no-restricted-globals */
self.addEventListener('push', event => {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon, // Your app's logo
      badge: '/logo.svg', // An optional small icon for some platforms
      data: {
        url: data.data.url // The URL to open when the notification is clicked
      }
    };
  
    // Broadcast to active clients for in-app toast notification
    self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ type: 'IN_APP_NOTIFICATION', payload: data });
      });
    });
  
    // Show the native system notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  self.addEventListener('notificationclick', event => {
    event.notification.close(); // Close the notification
  
    // This opens the URL specified in the push data
    const urlToOpen = new URL(event.notification.data.url, self.location.origin).href;
  
    event.waitUntil(
      self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      }).then(clientList => {
        if (clientList.length > 0) {
          // If a window is already open, focus it and navigate
          clientList[0].navigate(urlToOpen).then(client => client.focus());
        } else {
          // Otherwise, open a new window
          self.clients.openWindow(urlToOpen);
        }
      })
    );
  });
