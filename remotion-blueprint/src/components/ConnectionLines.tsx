import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { colors } from "../lib/colors";

interface ConnectionLinesProps {
  centerX: number;
  centerY: number;
  progress: number;
}

export const ConnectionLines: React.FC<ConnectionLinesProps> = ({
  centerX,
  centerY,
  progress,
}) => {
  const frame = useCurrentFrame();

  // Only show during collapse phase
  const opacity = interpolate(progress, [0.3, 0.6, 0.9, 1], [0, 0.8, 0.8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulse animation
  const pulseOffset = (frame * 2) % 20;

  // Connection points (vertical stack)
  const connectionCount = 3;
  const spacing = 40;

  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
      }}
    >
      {/* Vertical spine */}
      <line
        x1={centerX}
        y1={centerY - spacing * 1.5}
        x2={centerX}
        y2={centerY + spacing * 1.5}
        stroke={colors.navyMid}
        strokeWidth={2}
        strokeDasharray={`${20 - pulseOffset} 4`}
      />

      {/* Horizontal connections */}
      {Array.from({ length: connectionCount }).map((_, i) => {
        const yOffset = (i - 1) * spacing;
        const lineLength = interpolate(progress, [0.4, 0.7], [0, 80], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <g key={i}>
            {/* Left connection */}
            <line
              x1={centerX}
              y1={centerY + yOffset}
              x2={centerX - lineLength}
              y2={centerY + yOffset}
              stroke={colors.navyLight}
              strokeWidth={1}
              opacity={0.6}
            />
            {/* Right connection */}
            <line
              x1={centerX}
              y1={centerY + yOffset}
              x2={centerX + lineLength}
              y2={centerY + yOffset}
              stroke={colors.navyLight}
              strokeWidth={1}
              opacity={0.6}
            />
            {/* Center node */}
            <circle
              cx={centerX}
              cy={centerY + yOffset}
              r={4}
              fill={colors.navyDark}
            />
          </g>
        );
      })}

      {/* Outer ring (appears during collapse) */}
      <circle
        cx={centerX}
        cy={centerY}
        r={interpolate(progress, [0.5, 0.8], [0, 100], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })}
        fill="none"
        stroke={colors.navyFaint}
        strokeWidth={1}
        strokeDasharray="4 8"
        opacity={0.4}
      />
    </svg>
  );
};
