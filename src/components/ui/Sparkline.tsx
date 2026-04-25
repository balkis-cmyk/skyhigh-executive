import type { SVGProps } from "react";
import { cn } from "@/lib/cn";

export interface SparklineProps extends Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill" | "values"> {
  /** Data points (smallest index = oldest). */
  values: number[];
  /** Colour token, default accent. */
  color?: string;
  /** Width in px for the viewBox. */
  width?: number;
  /** Height in px for the viewBox. */
  height?: number;
  /** Optional fill under the line (low opacity). */
  showArea?: boolean;
}

export function Sparkline({
  values,
  color = "var(--accent)",
  width = 120,
  height = 32,
  showArea = true,
  className,
  ...rest
}: SparklineProps) {
  if (values.length < 2) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("overflow-visible", className)}
        width={width}
        height={height}
        {...rest}
      >
        <line
          x1={0} x2={width} y1={height / 2} y2={height / 2}
          stroke="var(--line)" strokeDasharray="2 3"
        />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padY = 4;
  const innerH = height - padY * 2;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = padY + (1 - (v - min) / range) * innerH;
    return [x, y];
  });
  const pathD = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;
  const lastX = points.at(-1)![0];
  const lastY = points.at(-1)![1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      width={width}
      height={height}
      {...rest}
    >
      {showArea && (
        <path
          d={areaD}
          fill={color}
          opacity={0.1}
        />
      )}
      <path
        d={pathD}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  );
}
