export function useNotifications() {
  const requestPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    }
    return false;
  };

  const scheduleNotification = (title: string, body: string, delayMs: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const timerId = setTimeout(() => {
        new Notification(title, { body, icon: '/vite.svg' });
      }, delayMs);

      // Store timer info for persistence
      const scheduled = JSON.parse(localStorage.getItem('scholify-notifications') || '[]');
      scheduled.push({
        title,
        body,
        scheduledAt: Date.now() + delayMs,
        timerId: timerId.toString(),
      });
      localStorage.setItem('scholify-notifications', JSON.stringify(scheduled));

      return timerId;
    }
    return null;
  };

  const scheduleAttendanceAlert = (courseName: string, classTime: string) => {
    const title = `📚 Attendance Alert: ${courseName}`;
    const body = `You have ${courseName} at ${classTime}. Don't miss it — your attendance is below 80%!`;
    return scheduleNotification(title, body, 0);
  };

  const scheduleAssignmentReminder = (title: string, daysLeft: number) => {
    const body = daysLeft === 0
      ? `"${title}" is due TODAY!`
      : `"${title}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
    return scheduleNotification(`📝 Assignment Reminder`, body, 0);
  };

  return { requestPermission, scheduleNotification, scheduleAttendanceAlert, scheduleAssignmentReminder };
}
