import { useState, useCallback, useRef } from "react";

/**
 * Custom hook for screen reader announcements.
 * Provides a standardized way to announce dynamic content changes
 * to assistive technologies via ARIA live regions.
 *
 * @returns Object containing:
 *   - announcement: Current announcement text (use in aria-live region)
 *   - announce: Function to trigger a new announcement
 *   - LiveRegion: JSX component to render the live region
 *
 * @example
 * ```tsx
 * const { announcement, announce } = useAnnounce();
 *
 * // In your component:
 * <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
 *   {announcement}
 * </div>
 *
 * // Trigger announcement:
 * announce("Calculation complete. Result: 10.5 mg/kg");
 * ```
 */
export function useAnnounce(clearDelayMs: number = 1000) {
  const [announcement, setAnnouncement] = useState<string>("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const announce = useCallback(
    (message: string) => {
      // Clear any pending clear timers so the latest message isn't cleared early
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }

      setAnnouncement(message);
      // Clear after announcement is made to allow re-announcing the same message
      timeoutRef.current = setTimeout(() => {
        setAnnouncement("");
        timeoutRef.current = null;
      }, clearDelayMs);
    },
    [clearDelayMs],
  );

  return { announcement, announce };
}

/**
 * Props for the LiveRegion component
 */
export interface LiveRegionProps {
  /** The announcement text to display */
  announcement: string;
  /** ARIA live politeness level */
  politeness?: "polite" | "assertive";
  /** Additional CSS class names */
  className?: string;
}

/**
 * A visually hidden live region component for screen reader announcements.
 * Use with the useAnnounce hook for dynamic content updates.
 */
export function LiveRegion({
  announcement,
  politeness = "polite",
  className = "",
}: LiveRegionProps) {
  return (
    <div
      className={`sr-only ${className}`.trim()}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
    >
      {announcement}
    </div>
  );
}
