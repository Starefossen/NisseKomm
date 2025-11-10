import { IconColor } from "@/lib/icons";

interface LEDIndicatorProps {
  color?: IconColor;
  blinking?: boolean;
  size?: number;
}

export function LEDIndicator({
  color = "green",
  blinking = true,
  size = 12,
}: LEDIndicatorProps) {
  const getColor = () => {
    switch (color) {
      case "green":
        return "var(--neon-green)";
      case "red":
        return "var(--christmas-red)";
      case "gold":
        return "var(--gold)";
      case "blue":
        return "var(--cold-blue)";
      case "gray":
        return "var(--gray)";
      default:
        return "var(--neon-green)";
    }
  };

  return (
    <div
      className="rounded-full border-2"
      style={{
        width: size,
        height: size,
        backgroundColor: getColor(),
        borderColor: getColor(),
        boxShadow: `0 0 8px ${getColor()}`,
        animation: blinking ? "pulse-led 2s ease-in-out infinite" : "none",
      }}
    />
  );
}
