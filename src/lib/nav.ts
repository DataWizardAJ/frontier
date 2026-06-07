import {
  LayoutDashboard,
  Radar,
  BookOpen,
  Target,
  FlaskConical,
  Bookmark,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  tagline: string;
}

export const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Your AI operator cockpit",
    tagline: "Everything at a glance",
  },
  {
    label: "Radar",
    href: "/radar",
    icon: Radar,
    description: "Live feed of the AI trends that matter",
    tagline: "What's moving in AI right now",
  },
  {
    label: "Explainers",
    href: "/explainers",
    icon: BookOpen,
    description: "Show me how to actually use it",
    tagline: "From trend to working knowledge",
  },
  {
    label: "Drills",
    href: "/drills",
    icon: Target,
    description: "Sharpen your skills, one challenge at a time",
    tagline: "Build mastery the Duolingo way",
  },
  {
    label: "Sandbox",
    href: "/sandbox",
    icon: FlaskConical,
    description: "Try the techniques for real",
    tagline: "A playground to experiment",
  },
  {
    label: "Import",
    href: "/import",
    icon: Bookmark,
    description: "Pull AI posts from your Instagram saves",
    tagline: "Feed your radar from your saved folder",
  },
];
