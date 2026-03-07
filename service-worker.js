self.addEventListener('push', (event) => {
   event.waitUntil(self.ServiceWorkerRegistration.showNotification('LocalPermits.app'));
});