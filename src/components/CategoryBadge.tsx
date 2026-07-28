import React, { createElement } from "react";
import {
  Tag,
  LucideIcon,
  Wallet,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Gift,
  Film,
  Coffee,
  Zap,
  HeartPulse,
  GraduationCap,
} from "lucide-react";

type BadgeSize = "sm" | "md" | "lg";

interface CategoryBadgeProps {
  name?: string;
  icon?: string | LucideIcon;
  color?: string;
  size?: BadgeSize;
}

const dimensionMap: Record<BadgeSize, { box: string; icon: number }> = {
  sm: { box: "h-8 w-8", icon: 14 },
  md: { box: "h-9 w-9", icon: 16 },
  lg: { box: "h-12 w-12", icon: 22 },
};

function getIconComponent(iconName?: string | LucideIcon): LucideIcon {
  if (typeof iconName === "function") return iconName;

  const iconsMap: Record<string, LucideIcon> = {
    wallet: Wallet,
    shopping: ShoppingBag,
    food: Utensils,
    transport: Car,
    home: Home,
    work: Briefcase,
    gift: Gift,
    entertainment: Film,
    coffee: Coffee,
    utilities: Zap,
    health: HeartPulse,
    education: GraduationCap,
  };

  if (iconName && iconsMap[iconName.toLowerCase()]) {
    return iconsMap[iconName.toLowerCase()];
  }

  return Tag;
}

export default function CategoryBadge({
  name,
  icon,
  color,
  size = "md",
}: CategoryBadgeProps) {
  const IconComponent = getIconComponent(icon);
  const { box, icon: iconSize } = dimensionMap[size] || dimensionMap.md;
  const baseColor = color || "#64748B";

  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`${box} rounded-lg flex items-center justify-center shrink-0`}
        style={{ backgroundColor: baseColor + "1A" }}
      >
        {createElement(IconComponent, {
          size: iconSize,
          style: { color: baseColor },
        })}
      </div>
      {name && (
        <span className="font-medium text-slate-900 truncate">{name}</span>
      )}
    </div>
  );
}
