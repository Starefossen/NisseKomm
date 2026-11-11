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
  locked?: boolean;
  teaser?: string;
  isNew?: boolean;
  onLockedClick?: () => void;
  className?: string;
}

export function DesktopIcon({
  icon,
  label,
  color = "green",
  disabled = false,
  unreadCount = 0,
  onClick,
  locked = false,
  teaser,
  isNew = false,
  onLockedClick,
  className = "",
}: DesktopIconProps) {
  const [isShaking, setIsShaking] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (disabled) {
      SoundManager.playSound("error");
      // Trigger lock shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      onLockedClick?.();
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
      aria-label={teaser ? `${label}, låst: ${teaser}` : undefined}
      className={`${className}
        flex flex-col items-center gap-2 p-3 md:p-4 relative
        w-full min-w-16 min-h-24
        border-2 transition-all focus-visible:outline-2 focus-visible:outline-(--gold)
        ${isNew ? "border-(--gold)!" : ""}
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
      {isNew && (
        <div className="absolute -top-1 -left-1 px-1 bg-(--gold) text-black text-base z-10 animate-[pulse-led_1.5s_ease-in-out_infinite]">
          NY
        </div>
      )}
      {locked && (
        <Icon
          name="lock"
          size={20}
          color="gray"
          className="absolute top-1 right-1"
        />
      )}
      <Icon
        name={icon}
        size={48}
        color={disabled ? "gray" : color}
        className="md:w-14 md:h-14"
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
      {teaser && (
        <span className="text-sm leading-tight text-center text-(--gray)">
          {teaser}
        </span>
      )}
    </button>
  );
}
