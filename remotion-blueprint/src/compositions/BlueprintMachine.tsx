import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Easing,
} from "remotion";
import { colors } from "../lib/colors";
import { BlueprintGrid } from "../components/BlueprintGrid";
import { IsometricLayer } from "../components/IsometricLayer";
import { Callout } from "../components/Callout";
import { TimelineMarker } from "../components/TimelineMarker";
import { ConnectionLines } from "../components/ConnectionLines";
import { CoreLogo } from "../components/CoreLogo";
import { ProgressPulse } from "../components/ProgressPulse";

export const BlueprintMachine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Center position (where DEM logo appears) - centered with callouts
  const centerX = width * 0.355;
  const centerY = height * 0.36;

  // Animation phases (in frames at 30fps)
  const gridOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Layer emergence timing - triggered by timeline pulses
  const layerConfigs = [
    { startFrame: 60, label: "Data Model", sublabel: "PostgreSQL • Redis • S3", number: "01", pulseFrom: 0 },
    { startFrame: 105, label: "Business Logic", sublabel: "APIs • Workflows • Rules", number: "02", pulseFrom: 1 },
    { startFrame: 150, label: "Interface", sublabel: "React • Mobile • Dashboard", number: "03", pulseFrom: 1 },
    { startFrame: 195, label: "Integrations", sublabel: "Stripe • Auth • Analytics", number: "04", pulseFrom: 2 },
  ];

  // Collapse animation (starts at frame 270)
  const collapseProgress = interpolate(frame, [270, 320], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Calculate layer positions - all centered
  const explodedSpacing = 70;

  // DEM logo position (where ConnectionLines and CoreLogo appear)
  const demLogoX = width * 0.50;
  const demLogoY = height * 0.5;

  const getLayerY = (index: number) => {
    const explodedY = centerY + (index - 1.5) * explodedSpacing;
    const collapsedY = centerY;
    return interpolate(collapseProgress, [0, 1], [explodedY, collapsedY]);
  };

  // Core logo appears after collapse (delayed by 0.5s = 15 frames)
  const coreOpacity = interpolate(frame, [345, 375], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const coreScale = spring({
    frame: frame - 345,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Timeline markers - positioned and equally spaced
  const timelineMarkers = [
    {
      frame: 45,
      label: "30 min",
      sublabel: "Discovery",
      y: height * 0.35,
      targetLayerIndex: 0,
    },
    {
      frame: 100,
      label: "24 hours",
      sublabel: "V1 Build",
      y: height * 0.5,
      targetLayerIndices: [1, 2],
    },
    {
      frame: 180,
      label: "7 days",
      sublabel: "Production",
      y: height * 0.65,
      targetLayerIndex: 3,
    },
  ];

  // Callout X position
  const calloutX = width * 0.647;

  return (
    <AbsoluteFill
      style={{
        background: colors.bgWhite,
      }}
    >
      {/* Background Grid - snaps to center during collapse */}
      {frame < 315 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            transform: `scale(${interpolate(frame, [290, 315], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.exp),
            })})`,
            opacity: interpolate(frame, [290, 315], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transformOrigin: `${width * 0.48}px ${height * 0.5}px`,
          }}
        >
          <BlueprintGrid opacity={gridOpacity} />
        </div>
      )}

      {/* Timeline Markers (left side) - snap to center during collapse */}
      {frame < 315 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: interpolate(frame, [290, 315], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
            transform: `scale(${interpolate(frame, [290, 315], [1, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.in(Easing.exp),
            })})`,
            transformOrigin: `${width * 0.48}px ${height * 0.5}px`,
          }}
        >
          {timelineMarkers.map((marker, i) => (
            <TimelineMarker
              key={i}
              frame={frame}
              startFrame={marker.frame}
              label={marker.label}
              sublabel={marker.sublabel}
              x={100}
              y={marker.y}
            />
          ))}
        </div>
      )}

      {/* Progress Pulses - from timeline to layers */}
      {/* 30 min → Data Model (horizontal line, 1.9x length) */}
      <ProgressPulse
        startX={180}
        startY={height * 0.35}
        endX={180 + (centerX - 160 - 180) * 1.9}
        endY={height * 0.35}
        triggerFrame={45}
        duration={15}
      />

      {/* 6 hours → Business Logic (horizontal line, 1.9x length) */}
      <ProgressPulse
        startX={180}
        startY={height * 0.5}
        endX={180 + (centerX - 160 - 180) * 1.9}
        endY={height * 0.5}
        triggerFrame={100}
        duration={12}
      />

      {/* 6 hours → Interface (horizontal line, 1.9x length) */}
      <ProgressPulse
        startX={180}
        startY={height * 0.5}
        endX={180 + (centerX - 160 - 180) * 1.9}
        endY={height * 0.5}
        triggerFrame={140}
        duration={12}
      />

      {/* 7 days → Integrations (horizontal line, 1.9x length) */}
      <ProgressPulse
        startX={180}
        startY={height * 0.65}
        endX={180 + (centerX - 160 - 180) * 1.9}
        endY={height * 0.65}
        triggerFrame={180}
        duration={15}
      />

      {/* 7 days → Collapse trigger (horizontal line, 1.9x length) */}
      <ProgressPulse
        startX={180}
        startY={height * 0.65}
        endX={180 + (centerX - 160 - 180) * 1.9}
        endY={height * 0.65}
        triggerFrame={250}
        duration={20}
      />

      {/* Connection Lines - removed for testing */}

      {/* Isometric Layers */}
      {layerConfigs.map((config, index) => {
        const layerProgress = spring({
          frame: frame - config.startFrame,
          fps,
          config: { damping: 15, stiffness: 80 },
        });

        const layerOpacity = interpolate(
          frame,
          [config.startFrame, config.startFrame + 15],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        // Fade out layers after compacting - fully gone by frame 345
        const fadeForCore = interpolate(frame, [320, 345], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Fade out callouts during compacting
        const calloutFade = interpolate(frame, [290, 315], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <React.Fragment key={index}>
            <IsometricLayer
              index={index}
              x={centerX}
              y={getLayerY(index)}
              progress={layerProgress}
              opacity={layerOpacity * fadeForCore}
              collapseProgress={collapseProgress}
            />
            <Callout
              frame={frame}
              startFrame={config.startFrame + 20}
              label={config.label}
              sublabel={config.sublabel}
              number={config.number}
              x={calloutX}
              y={getLayerY(index) + 125}
              opacity={calloutFade}
              textOffsetY={index >= 1 ? 8 : 0}
            />
          </React.Fragment>
        );
      })}

      {/* Central Core Logo (appears after collapse) */}
      <CoreLogo
        x={demLogoX}
        y={demLogoY}
        opacity={coreOpacity}
        scale={Math.max(0, coreScale)}
      />

      {/* Title - snaps to center during collapse */}
      {frame < 315 && (
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 100,
          opacity: interpolate(frame, [30, 50], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }) * interpolate(frame, [290, 315], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          transform: `scale(${interpolate(frame, [290, 315], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.exp),
          })})`,
          transformOrigin: `${width * 0.48 - 100}px ${height * 0.5 - 40}px`,
        }}
      >
        <div
          style={{
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: 14,
            fontWeight: 500,
            color: colors.textLight,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          DEM Systems
        </div>
        <div
          style={{
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: 32,
            fontWeight: 700,
            color: colors.textDark,
            letterSpacing: "-0.02em",
            marginTop: 8,
          }}
        >
          The Blueprint Machine
        </div>
      </div>
      )}

    </AbsoluteFill>
  );
};
