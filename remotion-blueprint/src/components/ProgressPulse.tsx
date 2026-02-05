import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { colors } from "../lib/colors";

interface ProgressPulseProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  triggerFrame: number;
  duration?: number;
}

export const ProgressPulse: React.FC<ProgressPulseProps> = ({
  startX,
  startY,
  endX,
  endY,
  triggerFrame,
  duration = 30,
}) => {
  const frame = useCurrentFrame();

  // Pulse travels from start to end
  const progress = interpolate(
    frame,
    [triggerFrame, triggerFrame + duration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  // Line draws from start toward end
  const lineProgress = interpolate(
    frame,
    [triggerFrame, triggerFrame + duration * 0.6],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.quad),
    }
  );

  // Line fades as pulse reaches destination
  const lineOpacity = interpolate(
    frame,
    [triggerFrame + duration * 0.5, triggerFrame + duration],
    [0.6, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Pulse dot position along the path
  const pulseX = interpolate(progress, [0, 1], [startX, endX]);
  const pulseY = interpolate(progress, [0, 1], [startY, endY]);

  // Pulse glow effect
  const pulseScale = interpolate(
    frame,
    [triggerFrame, triggerFrame + 10, triggerFrame + duration],
    [0, 1.5, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  // Impact burst at destination
  const impactProgress = interpolate(
    frame,
    [triggerFrame + duration - 5, triggerFrame + duration + 15],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const impactScale = interpolate(impactProgress, [0, 0.3, 1], [0, 1.5, 0]);
  const impactOpacity = interpolate(impactProgress, [0, 0.2, 1], [0, 0.8, 0]);

  if (frame < triggerFrame || frame > triggerFrame + duration + 20) {
    return null;
  }

  // Calculate line endpoint based on progress
  const currentEndX = interpolate(lineProgress, [0, 1], [startX, endX]);
  const currentEndY = interpolate(lineProgress, [0, 1], [startY, endY]);

  return (
    <svg
      style={{
        position: "absolute",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Pulse trail line */}
      <line
        x1={startX}
        y1={startY}
        x2={currentEndX}
        y2={currentEndY}
        stroke={colors.navyMid}
        strokeWidth={2}
        opacity={lineOpacity}
        strokeDasharray="8 4"
      />

      {/* Traveling pulse dot */}
      {progress < 1 && (
        <g>
          {/* Glow */}
          <circle
            cx={pulseX}
            cy={pulseY}
            r={12 * pulseScale}
            fill={colors.navyLight}
            opacity={0.3}
          />
          {/* Core */}
          <circle
            cx={pulseX}
            cy={pulseY}
            r={6}
            fill={colors.navyDark}
          />
        </g>
      )}

      {/* Impact burst at destination */}
      {impactProgress > 0 && (
        <g>
          <circle
            cx={endX}
            cy={endY}
            r={30 * impactScale}
            fill="none"
            stroke={colors.navyMid}
            strokeWidth={2}
            opacity={impactOpacity}
          />
          <circle
            cx={endX}
            cy={endY}
            r={15 * impactScale}
            fill={colors.navyLight}
            opacity={impactOpacity * 0.5}
          />
        </g>
      )}
    </svg>
  );
};
