import React from "react";
import { useCurrentFrame, interpolate, Easing, useVideoConfig } from "remotion";
import { colors } from "../lib/colors";

interface CoreLogoProps {
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

export const CoreLogo: React.FC<CoreLogoProps> = ({ x, y, opacity, scale }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animation phases (relative to when component becomes visible at frame 345)
  const localFrame = frame - 345;

  // Simple fade in for DEM (frames 0-15 local)
  const demFadeIn = interpolate(localFrame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Phase 3: "Systems" typewriter (frames 30-45 local) - faster
  const systemsText = "Systems";
  const visibleChars = Math.floor(
    interpolate(localFrame, [30, 45], [0, systemsText.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const displaySystems = systemsText.slice(0, visibleChars);

  // Phase 2: DEM shifts right slightly as Systems types (frames 20-35 local)
  const demShift = 6;

  // Text opacity (fades in during typewriter)
  const systemsOpacity = interpolate(localFrame, [30, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Cursor blink for typewriter effect (fades out at end)
  const cursorBlink = localFrame >= 30 && Math.floor(localFrame / 4) % 2 === 0;
  const cursorFade = interpolate(localFrame, [50, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorVisible = cursorBlink && cursorFade > 0 ? cursorFade : 0;

  // Phase 4: "Complexity → Clarity" flash effect (frames 65-80 local)
  const taglineFlash = (() => {
    if (localFrame < 65) return 0;
    if (localFrame < 80) {
      const flashPattern = [
        { start: 65, end: 67, value: 1 },
        { start: 67, end: 69, value: 0.3 },
        { start: 69, end: 71, value: 1 },
        { start: 71, end: 73, value: 0.5 },
        { start: 73, end: 80, value: 1 },
      ];
      for (const phase of flashPattern) {
        if (localFrame >= phase.start && localFrame < phase.end) {
          return phase.value;
        }
      }
      return 1;
    }
    return 1;
  })();

  const taglineVisible = localFrame >= 65 && localFrame < 95;

  // Phase 5: Pinch and snap effect (frames 90-100 local)
  const pinchScale = interpolate(localFrame, [90, 100], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.exp),
  });

  const mainContentVisible = localFrame < 100;

  // Phase 6: Sequential typewriter sentences (frames 110+)
  // 3x faster typing (~4 frames), 1.3s (39 frames) hold before delete
  const sentences = [
    { text: "30 minutes to understand.", start: 110, typeEnd: 114, deleteStart: 153, deleteEnd: 157 },
    { text: "24 hours to build.", start: 162, typeEnd: 166, deleteStart: 205, deleteEnd: 209 },
    { text: "7 days to production.", start: 214, typeEnd: 218, deleteStart: 257, deleteEnd: 261 },
  ];

  // "Ready?" types slowly after 1.5s cursor blink (45 frames)
  const readyStart = 306;
  const readyTypeEnd = 336; // Slow typing
  const readyText = "Ready?";

  // Arrow appears ~0.8s after Ready? completes
  const arrowStart = 360;

  const getCurrentSentence = () => {
    // Handle "Ready?" phase
    if (localFrame >= readyStart) {
      if (localFrame < readyTypeEnd) {
        const progress = interpolate(
          localFrame,
          [readyStart, readyTypeEnd],
          [0, readyText.length],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        return readyText.slice(0, Math.floor(progress));
      }
      return readyText;
    }

    // Handle cursor blink period (after last sentence delete, before Ready)
    if (localFrame >= sentences[2].deleteEnd && localFrame < readyStart) {
      return "";
    }

    for (const sentence of sentences) {
      if (localFrame >= sentence.start && localFrame < sentence.deleteEnd + 5) {
        // Typing phase
        if (localFrame < sentence.typeEnd) {
          const progress = interpolate(
            localFrame,
            [sentence.start, sentence.typeEnd],
            [0, sentence.text.length],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return sentence.text.slice(0, Math.floor(progress));
        }
        // Hold phase
        if (localFrame < sentence.deleteStart) {
          return sentence.text;
        }
        // Delete phase
        if (localFrame < sentence.deleteEnd) {
          const progress = interpolate(
            localFrame,
            [sentence.deleteStart, sentence.deleteEnd],
            [sentence.text.length, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          return sentence.text.slice(0, Math.floor(progress));
        }
        // After delete (for transition)
        return "";
      }
    }
    return "";
  };

  const sentenceText = getCurrentSentence();
  const showSentences = localFrame >= 110;

  // Cursor visible during typing, delete, and the 1.5s blink period before Ready
  // Slower blink rate (/15 for natural rhythm)
  const cursorBlinkPhase = Math.floor(localFrame / 15) % 2 === 0;
  // Cursor fades out just before Ready? completes (before the "?" appears)
  const cursorFadeOut = interpolate(localFrame, [333, 335], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const sentenceCursorVisible = showSentences && cursorBlinkPhase ? cursorFadeOut : 0;

  // Sentence fade in
  const sentenceOpacity = interpolate(localFrame, [110, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Arrow animation phases
  // 1 bounce, 2 bounce with pull back, pause, then explosive snap
  const pullBackStartFrame = 425;  // Start transitioning to pull-back
  const pullBackFrame = 435;       // Fully pulled back
  const holdEndFrame = 448;        // End of pause
  const stretchStartFrame = 448;
  const stretchEndFrame = 468;     // Breakneck speed - only 20 frames!

  // Arrow appears with bounce and full opacity pulse after "Ready?"
  const arrowOpacity = interpolate(localFrame, [arrowStart, arrowStart + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 40-100% opacity pulse during bounce phase, solid 100% during stretch
  const inStretchPhase = localFrame >= stretchStartFrame;
  const inHoldPhase = localFrame >= pullBackFrame && localFrame < holdEndFrame;
  const arrowPulseBase = localFrame >= arrowStart && !inStretchPhase && !inHoldPhase
    ? 0.4 + (Math.sin((localFrame - arrowStart) * 0.12) + 1) / 2 * 0.6
    : 1;
  const arrowPulse = (inStretchPhase || inHoldPhase) ? 1 : arrowPulseBase;

  // Bounce effect with smooth pull-back transition and hold
  const getBounceValue = () => {
    if (localFrame < arrowStart) return 0;
    if (localFrame < pullBackStartFrame) {
      // Normal bouncing
      return Math.sin((localFrame - arrowStart) * 0.11) * 8;
    }
    if (localFrame < pullBackFrame) {
      // Smooth transition from current bounce to pull-back position
      const currentBounce = Math.sin((localFrame - arrowStart) * 0.11) * 8;
      const pullBackProgress = interpolate(localFrame, [pullBackStartFrame, pullBackFrame], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      });
      return currentBounce * (1 - pullBackProgress) + (-8) * pullBackProgress;
    }
    if (localFrame < holdEndFrame) {
      // Hold at pulled-back position (negative = up)
      return -8;
    }
    // Smooth snap from -8 to 0 as descent begins
    const snapProgress = interpolate(localFrame, [holdEndFrame, holdEndFrame + 3], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return -8 * (1 - snapProgress);
  };
  const arrowBounce = getBounceValue();

  // Arrowhead descent - breakneck explosive acceleration
  // Custom aggressive easing: x^4 for extreme acceleration
  const arrowheadDescent = interpolate(localFrame, [stretchStartFrame, stretchEndFrame], [0, height * 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => t * t * t * t,  // Quartic easing - extreme acceleration
  });

  // Line length extends as arrowhead descends (base length is 28)
  const lineLength = 28 + arrowheadDescent;

  // Cute wiggle during tension hold - arrowhead trembles before launch
  const wiggleAmount = (localFrame >= pullBackFrame && localFrame < holdEndFrame)
    ? Math.sin((localFrame - pullBackFrame) * 1.5) * 2.5
    : 0;


  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%)`,
      }}
    >
      {/* Main content that pinches */}
      {mainContentVisible && (
        <div
          style={{
            transform: `scale(${scale * pinchScale})`,
            opacity: opacity * demFadeIn,
          }}
        >

          {/* Text container */}
          <div
            style={{
              position: "relative",
            }}
          >
            {/* DEM Systems row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transform: `translateX(${demShift}px)`,
                whiteSpace: "nowrap",
              }}
            >
              {/* DEM text */}
              <div
                style={{
                  fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: colors.navyDark,
                  letterSpacing: "-0.01em",
                }}
              >
                DEM
              </div>

              {/* Systems text with typewriter - always rendered for smooth layout */}
              <div
                style={{
                  fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                  fontSize: 36,
                  fontWeight: 700,
                  color: colors.navyDark,
                  letterSpacing: "-0.01em",
                  opacity: systemsOpacity,
                  display: "flex",
                  alignItems: "center",
                  minWidth: interpolate(localFrame, [20, 35], [0, 170], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                    easing: Easing.out(Easing.cubic),
                  }),
                }}
              >
                {displaySystems}
                <span
                  style={{
                    color: colors.navyMid,
                    marginLeft: 2,
                    opacity: cursorVisible,
                    fontWeight: 200,
                    transform: "scaleX(0.5)",
                  }}
                >
                  |
                </span>
              </div>
            </div>

            {/* Complexity → Clarity tagline - absolutely positioned below */}
            {taglineVisible && (
              <div
                style={{
                  position: "absolute",
                  top: 70,
                  left: "50%",
                  transform: "translateX(-55%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    fontFamily: "Satoshi, Inter, system-ui, sans-serif",
                    fontSize: 20,
                    fontWeight: 200,
                    color: colors.textMid,
                    letterSpacing: "0.05em",
                    opacity: taglineFlash,
                  }}
                >
                  Complexity → Clarity
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sequential sentences after snap - centered on canvas */}
      {showSentences && (
        <div
          style={{
            position: "absolute",
            left: width * 0.50 - x,
            top: height / 2 - y,
            transform: "translate(-50%, -50%)",
            opacity: sentenceOpacity,
            fontFamily: "Satoshi, Inter, system-ui, sans-serif",
            fontSize: 32,
            fontWeight: 500,
            color: colors.navyDark,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <span>{sentenceText}</span>
            <span
              style={{
                color: colors.navyMid,
                marginLeft: 2,
                fontWeight: 200,
                transform: "scaleX(0.5)",
                display: "inline-block",
                opacity: typeof sentenceCursorVisible === 'number' ? sentenceCursorVisible : (sentenceCursorVisible ? 1 : 0),
                width: "8px",
              }}
            >|</span>

            {/* Down arrow - absolutely positioned 60px below Ready?, no layout impact */}
            <svg
              width="24"
              height={32 + arrowheadDescent}
              viewBox={`0 0 24 ${32 + arrowheadDescent}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "100%",
                transform: `translateX(-50%) translateY(${arrowBounce}px)`,
                marginTop: 60,
                opacity: localFrame >= arrowStart ? arrowOpacity * arrowPulse : 0,
                overflow: "visible",
              }}
            >
              {/* Vertical line - stretches as arrowhead descends, bottom follows wiggle */}
              <line
                x1={12}
                y1={0}
                x2={12 + wiggleAmount}
                y2={lineLength}
                stroke={colors.navyMid}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
              {/* Arrowhead - moves down during stretch phase, wiggles during tension */}
              <path
                d={`M${4 + wiggleAmount} ${lineLength - 8} L${12 + wiggleAmount} ${lineLength} L${20 + wiggleAmount} ${lineLength - 8}`}
                stroke={colors.navyMid}
                strokeWidth={1.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
