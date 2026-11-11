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
  /** Icon beside the label on wide screens, for the I DAG stack under Julius */
  inline?: boolean;
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
  inline = false,
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
        flex ${inline ? "flex-col gap-1 lg:flex-row lg:gap-3 lg:justify-start lg:px-4" : "flex-col gap-1"} items-center justify-center px-2 py-1.5 relative
        w-full min-w-16 min-h-11
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
        <div
          className={`absolute -top-1 -right-1 w-6 h-6 bg-(--christmas-red) border-2 border-(--christmas-red) flex items-center justify-center z-10 ${inline ? "lg:static lg:order-last" : ""}`}
        >
          <span className="text-white text-base font-bold">{unreadCount}</span>
        </div>
      )}
      {isNew && (
        <div className="absolute -top-2 -left-2 px-2 py-0.5 border-2 border-black bg-(--gold) text-black text-lg leading-none tracking-widest z-10 shadow-[0_0_10px_var(--gold)] ">
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
        size={36}
        color={disabled ? "gray" : color}
        className="md:w-10 md:h-10"
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
        <span className="text-sm leading-none whitespace-nowrap text-(--gray)">
          {teaser}
        </span>
      )}
    </button>
  );
}
