import {
  ActivityIcon,
  AlertTriangleIcon,
  BookOpenCheckIcon,
  BookOpenIcon,
  BrainIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  CloudSunIcon,
  Code2Icon,
  DatabaseIcon,
  FileTextIcon,
  FlaskConicalIcon,
  GitBranchIcon,
  InfoIcon,
  LayersIcon,
  LightbulbIcon,
  ListChecksIcon,
  SparklesIcon,
  TargetIcon,
  TrophyIcon,
  XCircleIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { GenerativeUiTone } from "./renderingTypes";

const ICONS: Record<string, LucideIcon> = {
  activity: ActivityIcon,
  alert: AlertTriangleIcon,
  book: BookOpenIcon,
  brain: BrainIcon,
  check: CheckCircle2Icon,
  code: Code2Icon,
  data: DatabaseIcon,
  file: FileTextIcon,
  git: GitBranchIcon,
  idea: LightbulbIcon,
  info: InfoIcon,
  lab: FlaskConicalIcon,
  layers: LayersIcon,
  list: ListChecksIcon,
  question: CircleHelpIcon,
  sparkles: SparklesIcon,
  study: BookOpenCheckIcon,
  target: TargetIcon,
  trophy: TrophyIcon,
  weather: CloudSunIcon,
  x: XCircleIcon,
  zap: ZapIcon,
};

export const toneStyles: Record<
  GenerativeUiTone,
  {
    accent: string;
    border: string;
    chip: string;
    icon: string;
    soft: string;
    text: string;
  }
> = {
  neutral: {
    accent: "bg-muted-foreground",
    border: "border-border/70",
    chip: "border-border/70 bg-transparent text-muted-foreground",
    icon: "text-muted-foreground",
    soft: "bg-transparent",
    text: "text-foreground",
  },
  blue: {
    accent: "bg-[#83a598]",
    border: "border-border/70",
    chip: "border-[#83a598]/35 bg-transparent text-[#83a598]",
    icon: "text-[#83a598]",
    soft: "bg-transparent",
    text: "text-[#83a598]",
  },
  emerald: {
    accent: "bg-[#b8bb26]",
    border: "border-border/70",
    chip: "border-[#b8bb26]/35 bg-transparent text-[#b8bb26]",
    icon: "text-[#b8bb26]",
    soft: "bg-transparent",
    text: "text-[#b8bb26]",
  },
  amber: {
    accent: "bg-[#fabd2f]",
    border: "border-border/70",
    chip: "border-[#fabd2f]/35 bg-transparent text-[#fabd2f]",
    icon: "text-[#fabd2f]",
    soft: "bg-transparent",
    text: "text-[#fabd2f]",
  },
  rose: {
    accent: "bg-[#fb4934]",
    border: "border-border/70",
    chip: "border-[#fb4934]/35 bg-transparent text-[#fb4934]",
    icon: "text-[#fb4934]",
    soft: "bg-transparent",
    text: "text-[#fb4934]",
  },
  violet: {
    accent: "bg-[#d3869b]",
    border: "border-border/70",
    chip: "border-[#d3869b]/35 bg-transparent text-[#d3869b]",
    icon: "text-[#d3869b]",
    soft: "bg-transparent",
    text: "text-[#d3869b]",
  },
  cyan: {
    accent: "bg-[#8ec07c]",
    border: "border-border/70",
    chip: "border-[#8ec07c]/35 bg-transparent text-[#8ec07c]",
    icon: "text-[#8ec07c]",
    soft: "bg-transparent",
    text: "text-[#8ec07c]",
  },
};

export function GeneratedIcon({
  className,
  name,
  tone = "neutral",
}: {
  className?: string;
  name: string;
  tone?: GenerativeUiTone;
}) {
  const Icon = ICONS[name.toLowerCase()] ?? SparklesIcon;
  return <Icon aria-hidden="true" className={cn("size-4", toneStyles[tone].icon, className)} />;
}
