interface SpinnerProps {
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export default function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-spinner-track border-t-primary-light`}
    />
  );
}
