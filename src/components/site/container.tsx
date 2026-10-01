import { cn } from "@/lib/utils";

/** Standard centered content container matching the homepage max-width. */
export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-5 lg:px-8", className)}>
      {children}
    </div>
  );
}