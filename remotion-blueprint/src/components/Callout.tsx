import React from "react";
import { interpolate } from "remotion";
import { colors } from "../lib/colors";

interface CalloutProps {
  frame: number;
  startFrame: number;
  label: string;
  sublabel: string;
  number: string;
  x: number;
  y: number;
  opacity: number;
  textOffsetY?: number;
}

export const Callout: React.FC<CalloutProps> = ({
  frame,
  startFrame,
  label,
  sublabel,
  number,
  x,
  y,
  opacity: externalOpacity,
  textOffsetY = 0,
}) => {
  // Animation progress
  const lineProgress = interpolate(
    frame,
    [startFrame, startFrame + 15],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const textOpacity = interpolate(
    frame,
    [startFrame + 10, startFrame + 25],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const numberOpacity = interpolate(
    frame,
    [startFrame + 5, startFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Typewriter effect for label
  const visibleChars = Math.floor(
    interpolate(
      frame,
      [startFrame + 15, startFrame + 35],
      [0, label.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    )
  );

  const displayLabel = label.slice(0, visibleChars);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: "translateY(0%)",
        opacity: externalOpacity,
      }}
    >
      {/* Connector line */}
      <svg
        style={{
          position: "absolute",
          left: -140,
          top: 12,
          width: 140,
          height: 10,
          overflow: "visible",
        }}
      >
        {/* Dot at start */}
        <circle
          cx={0}
          cy={5}
          r={4}
          fill={colors.navyDark}
          opacity={lineProgress}
        />
        {/* Line */}
        <line
          x1={6}
          y1={5}
          x2={6 + 120 * lineProgress}
          y2={5}
          stroke={colors.navyMid}
          strokeWidth={1.5}
          opacity={0.8}
        />
      </svg>

      {/* Text content wrapper with optional offset */}
      <div style={{ transform: `translateY(${textOffsetY}px)` }}>
        {/* Number badge */}
        <div
          style={{
            fontFamily: "Satoshi, Inter, system-ui, monospace",
            fontSize: 11,
            fontWeight: 600,
            color: colors.bgWhite,
            background: colors.navyDark,
            padding: "2px 8px",
            borderRadius: 2,
            display: "inline-block",
            marginBottom: 6,
            opacity: numberOpacity,
            letterSpacing: "0.05em",
          }}
        >
          {number}
        </div>

        {/* Label */}
        <div
          style={{
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: 18,
            fontWeight: 600,
            color: colors.textDark,
            letterSpacing: "-0.01em",
            opacity: textOpacity,
            minHeight: 24,
          }}
        >
          {displayLabel}
          <span
            style={{
              opacity: frame % 20 < 10 ? 1 : 0,
              color: colors.navyMid,
            }}
          >
            |
          </span>
        </div>

        {/* Sublabel */}
        <div
          style={{
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: 12,
            fontWeight: 400,
            color: colors.textMid,
            marginTop: 4,
            opacity: interpolate(
              frame,
              [startFrame + 25, startFrame + 40],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            ),
            letterSpacing: "0.02em",
          }}
        >
          {sublabel}
        </div>
      </div>
    </div>
  );
};
