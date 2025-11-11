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
  Mail: (props: Omit<IconProps, "name">) => <Icon name="mail" {...props} />,
  Tv: (props: Omit<IconProps, "name">) => <Icon name="image" {...props} />,
  Chart: (props: Omit<IconProps, "name">) => <Icon name="chart" {...props} />,
  Play: (props: Omit<IconProps, "name">) => <Icon name="play" {...props} />,
  Pause: (props: Omit<IconProps, "name">) => <Icon name="pause" {...props} />,
  SkipForward: (props: Omit<IconProps, "name">) => (
    <Icon name="next" {...props} />
  ),
  SkipBack: (props: Omit<IconProps, "name">) => <Icon name="prev" {...props} />,
  // Weather icons
  Sun: (props: Omit<IconProps, "name">) => <Icon name="sun" {...props} />,
  Moon: (props: Omit<IconProps, "name">) => <Icon name="moon" {...props} />,
  Cloud: (props: Omit<IconProps, "name">) => <Icon name="cloud" {...props} />,
  Snow: (props: Omit<IconProps, "name">) => <Icon name="pin" {...props} />,
  // Camera/video icons
  Video: (props: Omit<IconProps, "name">) => <Icon name="video" {...props} />,
  Camera: (props: Omit<IconProps, "name">) => <Icon name="image" {...props} />,
  // Signal strength icons
  Signal0: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal-0" {...props} />
  ),
  Signal1: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal-1" {...props} />
  ),
  Signal2: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal-2" {...props} />
  ),
  Signal3: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal-3" {...props} />
  ),
  SignalOff: (props: Omit<IconProps, "name">) => (
    <Icon name="cellular-signal-off" {...props} />
  ),
  // Badge icons
  Coin: (props: Omit<IconProps, "name">) => <Icon name="coin" {...props} />,
  Heart: (props: Omit<IconProps, "name">) => (
    <Icon name="mood-happy" {...props} />
  ),
  Zap: (props: Omit<IconProps, "name">) => <Icon name="zap" {...props} />,
  Trophy: (props: Omit<IconProps, "name">) => <Icon name="trophy" {...props} />,
  Star: (props: Omit<IconProps, "name">) => <Icon name="star" {...props} />,
} as const;
