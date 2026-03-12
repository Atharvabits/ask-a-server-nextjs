interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({ size = 14, className = "" }: SpinnerProps) {
  return (
    <span
      className={`spinner ${className}`}
      style={{ width: size, height: size, borderWidth: Math.max(2, size / 7) }}
    />
  );
}
