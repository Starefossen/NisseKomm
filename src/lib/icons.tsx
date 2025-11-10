import { ComponentProps } from "react";

export type IconColor = "green" | "red" | "gold" | "blue" | "gray";

interface IconProps extends Omit<ComponentProps<"img">, "src" | "alt"> {
  name: string;
  size?: number;
  color?: IconColor;
}

const colorFilters: Record<IconColor, string> = {
  green:
    "brightness(0) saturate(100%) invert(75%) sepia(97%) saturate(3077%) hue-rotate(66deg) brightness(118%) contrast(128%)",
  red: "brightness(0) saturate(100%) invert(12%) sepia(100%) saturate(7426%) hue-rotate(1deg) brightness(106%) contrast(118%)",
  gold: "brightness(0) saturate(100%) invert(80%) sepia(62%) saturate(1523%) hue-rotate(359deg) brightness(104%) contrast(104%)",
  blue: "brightness(0) saturate(100%) invert(75%) sepia(71%) saturate(2234%) hue-rotate(151deg) brightness(104%) contrast(101%)",
  gray: "brightness(0) saturate(100%) invert(44%) sepia(0%) saturate(0%) hue-rotate(199deg) brightness(92%) contrast(88%)",
};

export function Icon({
  name,
  size = 24,
  color = "green",
  className = "",
  style,
  ...props
}: IconProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://unpkg.com/pixelarticons@1.8.1/svg/${name}.svg`}
      alt={name}
      width={size}
      height={size}
      className={`inline-block pixelated ${className}`}
      style={{
        filter: colorFilters[color],
        ...style,
      }}
      {...props}
    />
  );
}

// Common icons for easy use
export const Icons = {
  Folder: (props: Omit<IconProps, "name">) => <Icon name="folder" {...props} />,
  FolderOpen: (props: Omit<IconProps, "name">) => (
    <Icon name="folder" {...props} />
  ),
  File: (props: Omit<IconProps, "name">) => <Icon name="file" {...props} />,
  Alert: (props: Omit<IconProps, "name">) => <Icon name="alert" {...props} />,
  Warning: (props: Omit<IconProps, "name">) => <Icon name="alert" {...props} />,
  Settings: (props: Omit<IconProps, "name">) => (
    <Icon name="settings" {...props} />
  ),
  Help: (props: Omit<IconProps, "name">) => <Icon name="contact" {...props} />,
  Gps: (props: Omit<IconProps, "name">) => <Icon name="gps" {...props} />,
  Signal: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal" {...props} />
  ),
  Lock: (props: Omit<IconProps, "name">) => <Icon name="lock" {...props} />,
  Close: (props: Omit<IconProps, "name">) => <Icon name="close" {...props} />,
  Calendar: (props: Omit<IconProps, "name">) => (
    <Icon name="calendar" {...props} />
  ),
  CheckCircle: (props: Omit<IconProps, "name">) => (
    <Icon name="check" {...props} />
  ),
  ChevronRight: (props: Omit<IconProps, "name">) => (
    <Icon name="chevron-right" {...props} />
  ),
  ChevronDown: (props: Omit<IconProps, "name">) => (
    <Icon name="chevron-down" {...props} />
  ),
  Code: (props: Omit<IconProps, "name">) => <Icon name="code" {...props} />,
  Gift: (props: Omit<IconProps, "name">) => <Icon name="gift" {...props} />,
  Volume: (props: Omit<IconProps, "name">) => (
    <Icon name="audio-device" {...props} />
  ),
  Music: (props: Omit<IconProps, "name">) => <Icon name="music" {...props} />,
} as const;
