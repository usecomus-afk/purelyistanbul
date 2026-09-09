import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency: string = "EUR") {
  if (currency === "EUR") return `€${amount}`;
  if (currency === "USD") return `$${amount}`;
  if (currency === "TRY" || currency === "TL") return `₺${amount}`;
  return `${amount} ${currency}`;
}

export function generateCalendarUrl(title: string, description: string, location: string, dateStr: string, timeStr: string) {
  // Construct ISO start & end date for Google Calendar
  // Default duration 2 hours
  try {
    const cleanDate = dateStr.replace(/[^0-9]/g, '');
    const cleanTime = (timeStr || '10:00').replace(/[^0-9]/g, '').padEnd(4, '0').slice(0, 4);
    const startIso = `${cleanDate}T${cleanTime}00`;
    
    // Add 2 hours for end
    const hour = parseInt(cleanTime.slice(0, 2), 10);
    const endHour = ((hour + 2) % 24).toString().padStart(2, '0');
    const endIso = `${cleanDate}T${endHour}${cleanTime.slice(2, 4)}00`;

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `purelyİstanbul: ${title}`,
      details: `${description}\n\n🏨 Rezervasyon: purelyİstanbul Concierge Platformu`,
      location: location,
      dates: `${startIso}/${endIso}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  } catch (e) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&location=${encodeURIComponent(location)}`;
  }
}
