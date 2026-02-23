// Generate a Google Calendar event URL for a purchase reminder

export function generateGoogleCalendarUrl(itemName: string, waitUntilDate: string): string {
  const title = encodeURIComponent(`Revisit purchase: ${itemName}`);
  const date = waitUntilDate.replace(/-/g, '');
  // All-day event: use date format YYYYMMDD
  const dates = `${date}/${date}`;
  const details = encodeURIComponent(
    `Your waiting period for "${itemName}" is over. Take a moment to reflect on whether you still want to make this purchase.`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`;
}
