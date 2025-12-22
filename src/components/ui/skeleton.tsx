import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Accessible label describing what content is loading */
  label?: string;
}

/**
 * Skeleton loading placeholder component.
 * Displays an animated placeholder while content is loading.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton className="h-4 w-[250px]" />
 *
 * // With accessible label
 * <Skeleton label="Loading user profile" className="h-12 w-12 rounded-full" />
 * ```
 */
function Skeleton({ className, label, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      role="progressbar"
      aria-busy="true"
      aria-valuetext="Loading..."
      aria-label={label || "Loading content"}
      {...props}
    />
  );
}

export { Skeleton };
