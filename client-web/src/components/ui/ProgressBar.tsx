export function ProgressBar({
  value,
  color,
  width,
}: {
  value: number;
  color: string;
  width?: number;
}) {
  return (
    <div
      style={{
        height: 4,
        background: "var(--color-ivory-dark)",
        borderRadius: 2,
        marginTop: 5,
        overflow: "hidden",
        width,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 2,
          width: `${value}%`,
          background: color,
        }}
      />
    </div>
  );
}
