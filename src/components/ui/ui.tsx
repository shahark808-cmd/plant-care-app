import { cn } from "@/lib/cn";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 font-medium transition active:scale-[0.98] disabled:opacity-50",
        variant === "primary" && "bg-primary text-primary-fg",
        variant === "secondary" && "bg-surface-2 text-text",
        variant === "ghost" && "text-primary",
        variant === "danger" && "bg-danger text-white",
        className,
      )}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-3xl bg-surface p-5 shadow-card", className)} />;
}

export const inputClass =
  "w-full rounded-2xl border border-border bg-surface px-4 text-base text-text placeholder:text-muted";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-16 w-full", className)} aria-hidden />;
}

export function EmptyState({ emoji, title, hint }: { emoji: string; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
      <div className="text-5xl" aria-hidden>{emoji}</div>
      <p className="text-lg font-medium">{title}</p>
      {hint && <p className="text-muted">{hint}</p>}
    </div>
  );
}
