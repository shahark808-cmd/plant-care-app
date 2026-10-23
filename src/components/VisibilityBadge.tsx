import { Lock, Users } from "lucide-react";
import type { Visibility } from "@/lib/types";

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const shared = visibility === "shared";
  const Icon = shared ? Users : Lock;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted" title={shared ? "משותף" : "פרטי"}>
      <Icon size={14} aria-hidden />
      <span className="sr-only">{shared ? "משותף" : "פרטי"}</span>
    </span>
  );
}
