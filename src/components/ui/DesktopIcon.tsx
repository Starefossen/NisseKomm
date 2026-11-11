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
        flex flex-col gap-1 items-center justify-center px-2 py-1.5 relative
        w-full max-w-40 mx-auto min-w-16 min-h-11
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
      {isNew && (
        <div className="absolute top-0.5 right-0.5 px-1 border border-black bg-(--gold) text-black text-sm leading-none tracking-wider z-10">
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
      <span className="relative">
        <Icon
          name={icon}
          size={36}
          color={disabled ? "gray" : color}
          className="md:w-10 md:h-10"
        />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-3 min-w-5 h-5 px-1 bg-(--christmas-red) flex items-center justify-center text-white text-sm font-bold leading-none z-10">
            {unreadCount}
          </span>
        )}
      </span>
      <span
        className={`text-base md:text-lg tracking-wider whitespace-nowrap ${
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
        <span className="text-sm leading-none whitespace-nowrap text-(--gray)">
          {teaser}
        </span>
      )}
    </button>
  );
}
