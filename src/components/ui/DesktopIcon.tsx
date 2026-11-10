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
        flex flex-col items-center gap-2 p-3 md:p-4 relative
        w-full min-w-16 min-h-16 md:min-w-20 md:min-h-20
        border-2 transition-all
        ${
          disabled
            ? "border-(--gray) opacity-60 cursor-not-allowed"
            : "border-transparent hover:border-(--neon-green) hover:bg-(--neon-green)/10 hover:shadow-[0_0_15px_color-mix(in_oklab,var(--brass)_40%,transparent)] active:scale-95 cursor-pointer"
        }
        ${isShaking ? "animate-[lock-shake_0.3s_ease-in-out]" : ""}
      `}
    >
      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-(--christmas-red) border-2 border-(--christmas-red) flex items-center justify-center z-10">
          <span className="text-white text-base font-bold">{unreadCount}</span>
        </div>
      )}
      <Icon
        name={icon}
        size={40}
        color={disabled ? "gray" : color}
        className="md:w-12 md:h-12"
      />
      <span
        className={`text-base md:text-lg tracking-wider ${
          disabled
            ? "text-(--gray)"
            : color === "gold"
              ? "text-(--gold)"
              : color === "blue"
                ? "text-(--cold-blue)"
                : "text-(--neon-green)"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
