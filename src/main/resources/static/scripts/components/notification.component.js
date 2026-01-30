export function showNotification(message, type = "success", duration = 3000) {
  const notification = document.createElement("div");
  notification.classList.add("notification", `notification-${type}`);
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("notification-exit");
    setTimeout(() => notification.remove(), 300);
  }, duration);

  return notification;
}

export function showSuccessNotification(message) {
  return showNotification(message, "success");
}

export function showErrorNotification(message) {
  return showNotification(message, "error");
}

export function showInfoNotification(message) {
  return showNotification(message, "info");
}

export function clearAllNotifications() {
  const notifications = document.querySelectorAll(
    '[style*="position: fixed"][style*="right: 20px"]'
  );
  notifications.forEach((notification) => {
    if (notification.textContent) {
      notification.remove();
    }
  });
}
