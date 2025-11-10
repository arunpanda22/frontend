import { LucideIcon } from "lucide-react";

export interface MetricsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  changeType?: "increase" | "decrease";
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
  showTrendButton?: boolean;  // Changed from 'false' to 'boolean'
  trendData?: any;  // You can make this more specific based on your chart data structure
  onViewTrends?: () => void;  // Function type that takes no parameters and returns nothing
}