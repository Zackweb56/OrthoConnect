import {
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CircleUserRound,
  ClipboardList,
  Clock3,
  CreditCard,
  FolderHeart,
  House,
  LayoutDashboard,
  Puzzle,
  Settings2,
  UsersRound,
  Wallet,
} from "lucide-react";

export const navigationIcons = {
  Building2,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CircleUserRound,
  ClipboardList,
  Clock3,
  CreditCard,
  FolderHeart,
  House,
  LayoutDashboard,
  Puzzle,
  Settings2,
  UsersRound,
  Wallet,
};

export function getNavigationIcon(name) {
  const Icon = navigationIcons[name];

  if (!Icon) {
    throw new RangeError(`Unknown navigation icon: ${name}`);
  }

  return Icon;
}
