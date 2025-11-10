interface StatusBarProps {
  label: string;
  value: number;
  max: number;
  status?: "normal" | "advarsel" | "kritisk";
}

export function StatusBar({
  label,
  value,
  max,
  status = "normal",
}: StatusBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (status === "kritisk") return "var(--christmas-red)";
    if (status === "advarsel") return "var(--gold)";
    return "var(--neon-green)";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className="w-full h-4 border-2 border-[var(--neon-green)] bg-black">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
    </div>
  );
}
