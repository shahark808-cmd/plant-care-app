import { Circle, type LucideProps } from "lucide-react";
import { ICONS } from "@/lib/icons";

export function CategoryIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = ICONS[name] ?? Circle;
  return <Icon aria-hidden {...props} />;
}
