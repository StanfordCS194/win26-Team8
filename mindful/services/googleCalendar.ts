/**
 * Generate a Google Calendar URL to remind the user about a purchase wait period.
 */
export function generateGoogleCalendarUrl(itemName: string, waitUntilDate: string): string {
  const date = new Date(waitUntilDate);
  // Format as all-day event: YYYYMMDD
  const startDate = date.toISOString().replace(/[-:]/g, '').split('T')[0];
  // End date is the next day for an all-day event
  const endDate = new Date(date.getTime() + 86400000)
    .toISOString()
    .replace(/[-:]/g, '')
    .split('T')[0];

  const title = encodeURIComponent(`Mindful: Revisit "${itemName}"`);
  const details = encodeURIComponent(
    `Your waiting period for "${itemName}" is over. Time to revisit your purchase decision mindfully!`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
}
