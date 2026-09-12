/** Local notification queue for Insight events when API is offline. */

export type LocalInsightNotification = {
  id: string;
  specialistId: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
};

const KEY = "cintexa.insight.notifications";

export function readLocalNotifications(): LocalInsightNotification[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalInsightNotification[];
  } catch {
    return [];
  }
}

export function pushLocalNotification(n: Omit<LocalInsightNotification, "id" | "createdAt" | "read">) {
  const item: LocalInsightNotification = {
    ...n,
    id: `local_${Date.now()}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const prev = readLocalNotifications();
  localStorage.setItem(KEY, JSON.stringify([item, ...prev].slice(0, 40)));
  return item;
}

export function markLocalNotificationRead(id: string) {
  const next = readLocalNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
