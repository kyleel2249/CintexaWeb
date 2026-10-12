import { useState } from "react";

/** "Now", captured once when the component mounts (keeps render pure and labels from flickering). */
export function useNow(): Date {
  const [now] = useState(() => new Date());
  return now;
}
