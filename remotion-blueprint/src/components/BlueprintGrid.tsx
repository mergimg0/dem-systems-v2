import React from "react";
import { useVideoConfig, useCurrentFrame, interpolate } from "remotion";
import { colors } from "../lib/colors";

interface BlueprintGridProps {
  opacity: number;
}

export const BlueprintGrid: React.FC<BlueprintGridProps> = ({ opacity }) => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const gridSpacing = 60;
  const horizontalLines = Math.ceil(height / gridSpacing);
  const verticalLines = Math.ceil(width / gridSpacing);

  // Staggered line drawing
  const getLineProgress = (index: number) => {
    const staggerDelay = index * 2;
    return interpolate(frame, [staggerDelay, staggerDelay + 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        opacity,
      }}
    >
      <defs>
        {/* Navy gradient for lines */}
        <linearGradient id="navyGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={colors.navyGhost} stopOpacity="0" />
          <stop offset="20%" stopColor={colors.navyFaint} stopOpacity="0.5" />
          <stop offset="50%" stopColor={colors.navyLight} stopOpacity="0.6" />
          <stop offset="80%" stopColor={colors.navyFaint} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.navyGhost} stopOpacity="0" />
        </linearGradient>
        <linearGradient id="navyGradientV" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={colors.navyGhost} stopOpacity="0" />
          <stop offset="20%" stopColor={colors.navyFaint} stopOpacity="0.5" />
          <stop offset="50%" stopColor={colors.navyLight} stopOpacity="0.6" />
          <stop offset="80%" stopColor={colors.navyFaint} stopOpacity="0.5" />
          <stop offset="100%" stopColor={colors.navyGhost} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Horizontal lines with gradient */}
      {Array.from({ length: horizontalLines }).map((_, i) => {
        const y = i * gridSpacing;
        const progress = getLineProgress(i);
        const lineLength = width * progress;

        return (
          <line
            key={`h-${i}`}
            x1={(width - lineLength) / 2}
            y1={y}
            x2={(width + lineLength) / 2}
            y2={y}
            stroke="url(#navyGradientH)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Vertical lines with gradient */}
      {Array.from({ length: verticalLines }).map((_, i) => {
        const x = i * gridSpacing;
        const progress = getLineProgress(i + horizontalLines);
        const lineLength = height * progress;

        return (
          <line
            key={`v-${i}`}
            x1={x}
            y1={(height - lineLength) / 2}
            x2={x}
            y2={(height + lineLength) / 2}
            stroke="url(#navyGradientV)"
            strokeWidth={0.5}
          />
        );
      })}

      {/* Accent crosshairs at center - fade out during collapse */}
      <g opacity={interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * interpolate(frame, [290, 315], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
        {/* Horizontal accent */}
        <line
          x1={width * 0.34}
          y1={height * 0.51}
          x2={width * 0.64}
          y2={height * 0.51}
          stroke={colors.navyFaint}
          strokeWidth={1}
          strokeDasharray="8 4"
        />
        {/* Vertical accent */}
        <line
          x1={width * 0.49}
          y1={height * 0.26}
          x2={width * 0.49}
          y2={height * 0.76}
          stroke={colors.navyFaint}
          strokeWidth={1}
          strokeDasharray="8 4"
        />
      </g>

      {/* Corner markers - subtle navy */}
      {[
        { x: 40, y: 40 },
        { x: width - 40, y: 40 },
        { x: 40, y: height - 40 },
        { x: width - 40, y: height - 40 },
      ].map((pos, i) => (
        <g
          key={`corner-${i}`}
          opacity={interpolate(frame, [20 + i * 5, 40 + i * 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) * interpolate(frame, [290, 315], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        >
          <line
            x1={pos.x - 12}
            y1={pos.y}
            x2={pos.x + 12}
            y2={pos.y}
            stroke={colors.navyMid}
            strokeWidth={1.5}
          />
          <line
            x1={pos.x}
            y1={pos.y - 12}
            x2={pos.x}
            y2={pos.y + 12}
            stroke={colors.navyMid}
            strokeWidth={1.5}
          />
        </g>
      ))}
    </svg>
  );
};
