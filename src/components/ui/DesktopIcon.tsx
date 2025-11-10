"use client";

import { useState, useRef } from "react";
import { Icon, IconColor } from "@/lib/icons";
import { SoundManager } from "@/lib/sounds";

interface DesktopIconProps {
  icon: string;
  label: string;
  color?: IconColor;
  disabled?: boolean;
  unreadCount?: number;
  onClick: () => void;
}

export function DesktopIcon({
  icon,
  label,
  color = "green",
  disabled = false,
  unreadCount = 0,
  onClick,
}: DesktopIconProps) {
  const [isShaking, setIsShaking] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (disabled) {
      SoundManager.playSound("error");
      // Trigger lock shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
    } else {
      SoundManager.playSound("click");
      onClick();
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      disabled={disabled && false} // Allow clicks on disabled for animation
      className={`
        flex flex-col items-center gap-2 p-4 relative
        border-2 transition-all
        ${
          disabled
            ? "border-(--gray) opacity-60 cursor-not-allowed"
            : "border-transparent hover:border-(--neon-green)r:shadow-[0_0_15px_rgba(0,255,0,0.4)] cursor-pointer"
        }
        ${isShaking ? "animate-[lock-shake_0.3s_ease-in-out]" : ""}
      `}
    >
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-(--christmas-red) border-2 border-(--christmas-red) flex items-center justify-center z-10">
          <span className="text-white text-xs font-bold">{unreadCount}</span>
        </div>
      )}
      <Icon name={icon} size={48} color={disabled ? "gray" : color} />
      <span
        className={`text-sm tracking-wider ${disabled ? "text-(--gray)" : `text-[var(--${color === "green" ? "neon-green" : color === "gold" ? "gold" : color === "blue" ? "cold-blue" : "neon-green"})]`}`}
      >
        {label}
      </span>
    </button>
  );
}
