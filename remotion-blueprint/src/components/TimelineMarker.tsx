import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { colors } from "../lib/colors";

interface TimelineMarkerProps {
  frame: number;
  startFrame: number;
  label: string;
  sublabel: string;
  x: number;
  y: number;
}

export const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  frame,
  startFrame,
  label,
  sublabel,
  x,
  y,
}) => {
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 20],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideX = interpolate(
    frame,
    [startFrame, startFrame + 25],
    [-30, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 15, stiffness: 100 },
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x + slideX,
        top: y - 20,
        opacity,
        transform: `scale(${Math.max(0, scale)})`,
        transformOrigin: "left center",
      }}
    >
      {/* Vertical line */}
      <div
        style={{
          position: "absolute",
          left: -20,
          top: 0,
          width: 2,
          height: 40,
          background: `linear-gradient(180deg, ${colors.navyMid} 0%, transparent 100%)`,
          opacity: 0.6,
        }}
      />

      {/* Main label */}
      <div
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          color: colors.navyDark,
          letterSpacing: "-0.02em",
        }}
      >
        {label}
      </div>

      {/* Sublabel */}
      <div
        style={{
          fontFamily: "Satoshi, Inter, system-ui, sans-serif",
          fontSize: 12,
          fontWeight: 500,
          color: colors.textMid,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginTop: 2,
        }}
      >
        {sublabel}
      </div>
    </div>
  );
};
