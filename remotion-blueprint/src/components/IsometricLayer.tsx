import React from "react";
import { interpolate } from "remotion";
import { colors } from "../lib/colors";

interface IsometricLayerProps {
  index: number;
  x: number;
  y: number;
  progress: number;
  opacity: number;
  collapseProgress: number;
}

export const IsometricLayer: React.FC<IsometricLayerProps> = ({
  index,
  x,
  y,
  progress,
  opacity,
  collapseProgress,
}) => {
  // Layer dimensions (isometric)
  const layerWidth = 320;
  const layerHeight = 180;
  const layerDepth = 20;

  // Scale and offset based on progress
  const scale = interpolate(progress, [0, 1], [0.8, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  // Different internal details for each layer
  const layerDetails = [
    // Layer 0: Data Model - Database icons
    <g key="data-details">
      {/* Database cylinders */}
      <ellipse cx={-60} cy={-10} rx={25} ry={12} fill="none" stroke={colors.navyMid} strokeWidth={1.5} opacity={0.8} />
      <line x1={-85} y1={-10} x2={-85} y2={15} stroke={colors.navyMid} strokeWidth={1.5} opacity={0.8} />
      <line x1={-35} y1={-10} x2={-35} y2={15} stroke={colors.navyMid} strokeWidth={1.5} opacity={0.8} />
      <ellipse cx={-60} cy={15} rx={25} ry={12} fill="none" stroke={colors.navyMid} strokeWidth={1.5} opacity={0.8} />

      {/* Data flow lines */}
      <path d="M-30,-5 L20,-5 L20,5 L60,5" fill="none" stroke={colors.navyLight} strokeWidth={1} strokeDasharray="4 2" opacity={0.6} />
      <circle cx={60} cy={5} r={4} fill={colors.navyDark} opacity={0.8} />

      {/* Table schema */}
      <rect x={70} y={-25} width={60} height={50} fill="none" stroke={colors.navyFaint} strokeWidth={1} rx={2} opacity={0.6} />
      <line x1={70} y1={-10} x2={130} y2={-10} stroke={colors.navyFaint} strokeWidth={1} opacity={0.4} />
      <line x1={70} y1={5} x2={130} y2={5} stroke={colors.navyFaint} strokeWidth={1} opacity={0.4} />
    </g>,

    // Layer 1: Business Logic - Flow diagram
    <g key="logic-details">
      {/* Process nodes */}
      <rect x={-80} y={-15} width={40} height={30} fill="none" stroke={colors.navyMid} strokeWidth={1.5} rx={4} opacity={0.8} />
      <rect x={-20} y={-15} width={40} height={30} fill="none" stroke={colors.navyMid} strokeWidth={1.5} rx={4} opacity={0.8} />
      <rect x={40} y={-15} width={40} height={30} fill="none" stroke={colors.navyMid} strokeWidth={1.5} rx={4} opacity={0.8} />

      {/* Arrows */}
      <path d="M-38,0 L-25,0" fill="none" stroke={colors.navyLight} strokeWidth={1.5} opacity={0.7} />
      <path d="M22,0 L35,0" fill="none" stroke={colors.navyLight} strokeWidth={1.5} opacity={0.7} />

      {/* Decision diamond */}
      <polygon points="100,0 115,-15 130,0 115,15" fill="none" stroke={colors.accentWarm} strokeWidth={1.5} opacity={0.6} />

      {/* Branch lines */}
      <path d="M82,0 L95,0" fill="none" stroke={colors.navyLight} strokeWidth={1} opacity={0.5} />
      <path d="M130,0 L145,0 L145,-20" fill="none" stroke={colors.navyFaint} strokeWidth={1} opacity={0.4} />
      <path d="M130,0 L145,0 L145,20" fill="none" stroke={colors.navyFaint} strokeWidth={1} opacity={0.4} />
    </g>,

    // Layer 2: Interface - UI wireframe
    <g key="ui-details">
      {/* Browser frame */}
      <rect x={-100} y={-30} width={200} height={60} fill="none" stroke={colors.navyMid} strokeWidth={1.5} rx={4} opacity={0.8} />
      <line x1={-100} y1={-18} x2={100} y2={-18} stroke={colors.navyMid} strokeWidth={1} opacity={0.6} />

      {/* Browser dots */}
      <circle cx={-90} cy={-24} r={3} fill={colors.accentWarm} opacity={0.6} />
      <circle cx={-80} cy={-24} r={3} fill={colors.navyLight} opacity={0.6} />
      <circle cx={-70} cy={-24} r={3} fill={colors.navyFaint} opacity={0.6} />

      {/* Content placeholders */}
      <rect x={-90} y={-10} width={60} height={8} fill={colors.navyFaint} opacity={0.4} rx={2} />
      <rect x={-90} y={2} width={40} height={6} fill={colors.navyGhost} opacity={0.3} rx={2} />
      <rect x={-90} y={12} width={50} height={6} fill={colors.navyGhost} opacity={0.3} rx={2} />

      {/* Sidebar */}
      <rect x={-20} y={-10} width={110} height={35} fill="none" stroke={colors.navyFaint} strokeWidth={1} rx={2} opacity={0.4} />
    </g>,

    // Layer 3: Integrations - API connections
    <g key="integration-details">
      {/* Central hub */}
      <circle cx={0} cy={0} r={20} fill="none" stroke={colors.navyMid} strokeWidth={2} opacity={0.9} />
      <circle cx={0} cy={0} r={8} fill={colors.navyFaint} opacity={0.3} />

      {/* External service nodes */}
      {[-60, -30, 30, 60].map((angle, i) => {
        const rad = (angle * Math.PI) / 180 + Math.PI / 4;
        const nodeX = Math.cos(rad) * 70;
        const nodeY = Math.sin(rad) * 40;
        const nodeColors = [colors.accentWarm, colors.navyMid, colors.navyLight, colors.navyDark];

        return (
          <g key={i}>
            {/* Connection line */}
            <line
              x1={Math.cos(rad) * 22}
              y1={Math.sin(rad) * 22}
              x2={nodeX - Math.cos(rad) * 12}
              y2={nodeY - Math.sin(rad) * 12}
              stroke={nodeColors[i]}
              strokeWidth={1}
              strokeDasharray="4 2"
              opacity={0.6}
            />
            {/* Node */}
            <rect
              x={nodeX - 12}
              y={nodeY - 12}
              width={24}
              height={24}
              fill="none"
              stroke={nodeColors[i]}
              strokeWidth={1.5}
              rx={4}
              opacity={0.7}
            />
          </g>
        );
      })}
    </g>,
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + translateY,
        transform: `translate(-50%, -50%) scale(${scale}) skewY(-15) scaleY(0.866)`,
        transformOrigin: "center center",
        opacity,
      }}
    >
      <svg
        width={layerWidth + 200}
        height={layerHeight + 100}
        viewBox={`${-layerWidth / 2 - 100} ${-layerHeight / 2 - 50} ${layerWidth + 200} ${layerHeight + 100}`}
        style={{ overflow: "visible" }}
      >
        <g>
        {/* Layer base (isometric rectangle) */}
        <path
          d={`
            M${-layerWidth / 2},0
            L0,${-layerHeight / 2}
            L${layerWidth / 2},0
            L0,${layerHeight / 2}
            Z
          `}
          fill={colors.layerFill}
          stroke={colors.navyDark}
          strokeWidth={2}
        />

        {/* Layer depth (side faces) */}
        <path
          d={`
            M${-layerWidth / 2},0
            L${-layerWidth / 2},${layerDepth}
            L0,${layerHeight / 2 + layerDepth}
            L0,${layerHeight / 2}
            Z
          `}
          fill={colors.bgWarm}
          stroke={colors.navyFaint}
          strokeWidth={1}
          opacity={0.8}
        />
        <path
          d={`
            M0,${layerHeight / 2}
            L0,${layerHeight / 2 + layerDepth}
            L${layerWidth / 2},${layerDepth}
            L${layerWidth / 2},0
            Z
          `}
          fill={colors.bgWhite}
          stroke={colors.navyFaint}
          strokeWidth={1}
          opacity={0.8}
        />

        {/* Internal details */}
        <g
          opacity={interpolate(collapseProgress, [0, 0.5], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        >
          {layerDetails[index]}
        </g>

        {/* Corner accents */}
        <circle cx={-layerWidth / 2} cy={0} r={3} fill={colors.navyDark} opacity={0.8} />
        <circle cx={0} cy={-layerHeight / 2} r={3} fill={colors.navyDark} opacity={0.8} />
        <circle cx={layerWidth / 2} cy={0} r={3} fill={colors.navyDark} opacity={0.8} />
        <circle cx={0} cy={layerHeight / 2} r={3} fill={colors.navyDark} opacity={0.8} />
      </g>
      </svg>
    </div>
  );
};
