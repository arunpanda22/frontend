import { LucideIcon } from "lucide-react";

export interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string; // Made optional
  changeType?: "increase" | "decrease"; // Made optional
  bgColor?:
    | "blue"
    | "green" 
    | "purple"
    | "orange"
    | "red"
    | "indigo"
    | "pink"
    | "yellow";
  className?: string;
}