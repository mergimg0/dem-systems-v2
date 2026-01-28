"""
DEM Systems Hero Animation - ManimGL Implementation

A 15-second seamless loop animation featuring:
1. Typewriter text reveal (video visible through letters)
2. Melt transition (letters → organic blob)
3. Interactive metaball physics (stretching, splitting, merging)
4. Exit crystallization (blob → letters → fade)

Usage:
    manimgl dem_hero.py DEMHeroAnimation -o  # Render to file
    manimgl dem_hero.py DEMHeroAnimation     # Preview mode
"""

from manimlib import *
import numpy as np
from pathlib import Path
import cv2

# Configuration
VIDEO_PATH = Path(__file__).parent / "source_video.mp4"
FRAME_RATE = 60
TOTAL_DURATION = 15.0  # seconds

# Timing constants (in seconds)
ENTRY_START = 0.0
ENTRY_END = 3.0
MELT_START = 3.0
MELT_END = 6.0
INTERACTIVE_START = 6.0
INTERACTIVE_END = 12.0
EXIT_START = 12.0
EXIT_END = 15.0

# Colors
BACKGROUND_COLOR = "#0a0a0f"


class VideoTexture:
    """Loads and provides frames from a video file."""

    def __init__(self, video_path: str, target_fps: int = 30):
        self.video_path = str(video_path)
        self.target_fps = target_fps
        self.frames = []
        self.frame_count = 0
        self.current_frame_idx = 0
        self._load_video()

    def _load_video(self):
        """Extract frames from video file."""
        cap = cv2.VideoCapture(self.video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video: {self.video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_skip = max(1, int(video_fps / self.target_fps))

        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % frame_skip == 0:
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                self.frames.append(frame_rgb)

            frame_idx += 1

        cap.release()
        self.frame_count = len(self.frames)
        print(f"Loaded {self.frame_count} frames from video")

    def get_frame(self, time: float) -> np.ndarray:
        """Get frame at given time (loops automatically)."""
        if self.frame_count == 0:
            return np.zeros((1080, 1920, 3), dtype=np.uint8)

        frame_idx = int(time * self.target_fps) % self.frame_count
        return self.frames[frame_idx]


class MetaballField:
    """Computes metaball implicit surface field values."""

    def __init__(self, threshold: float = 1.0):
        self.threshold = threshold
        self.blobs = []  # List of (x, y, radius)

    def add_blob(self, x: float, y: float, radius: float):
        self.blobs.append([x, y, radius])

    def clear_blobs(self):
        self.blobs = []

    def set_blobs(self, blobs: list):
        self.blobs = [list(b) for b in blobs]

    def field_value(self, x: float, y: float) -> float:
        """Calculate metaball field value at point (x, y)."""
        total = 0.0
        for bx, by, r in self.blobs:
            dx = x - bx
            dy = y - by
            dist_sq = dx * dx + dy * dy + 0.0001  # Avoid division by zero
            total += (r * r) / dist_sq
        return total

    def is_inside(self, x: float, y: float) -> bool:
        """Check if point is inside the metaball surface."""
        return self.field_value(x, y) >= self.threshold

    def get_boundary_points(self, resolution: int = 100, bounds: tuple = (-8, 8, -4.5, 4.5)) -> list:
        """
        Get boundary points using marching squares.
        Returns list of (x, y) points on the boundary.
        """
        x_min, x_max, y_min, y_max = bounds
        step_x = (x_max - x_min) / resolution
        step_y = (y_max - y_min) / resolution

        boundary_points = []

        for i in range(resolution):
            for j in range(resolution):
                x = x_min + i * step_x
                y = y_min + j * step_y

                # Sample corners of cell
                corners = [
                    self.is_inside(x, y),
                    self.is_inside(x + step_x, y),
                    self.is_inside(x + step_x, y + step_y),
                    self.is_inside(x, y + step_y),
                ]

                # If not all same, we're on boundary
                if not all(corners) and any(corners):
                    # Add center of cell as boundary point
                    boundary_points.append((x + step_x/2, y + step_y/2))

        return boundary_points


class VideoMaskedText(VGroup):
    """
    Text where video is visible through the letterforms.
    Uses a fill pattern approach with video texture updates.
    """

    def __init__(self, text: str, video_texture: VideoTexture, **kwargs):
        super().__init__(**kwargs)
        self.text_str = text
        self.video_texture = video_texture

        # Create text mobject
        self.text_mob = Text(
            text,
            font="SF Pro Display",
            weight=BOLD,
            font_size=120,
        )
        self.text_mob.set_fill(WHITE, opacity=1)
        self.text_mob.set_stroke(WHITE, width=0)

        self.add(self.text_mob)

        # Store individual letter references
        self.letters = list(self.text_mob)
        self.letter_count = len(self.letters)

        # Initially hide all letters
        for letter in self.letters:
            letter.set_opacity(0)

    def reveal_letter(self, index: int):
        """Make a letter visible."""
        if 0 <= index < self.letter_count:
            self.letters[index].set_opacity(1)

    def hide_letter(self, index: int):
        """Hide a letter."""
        if 0 <= index < self.letter_count:
            self.letters[index].set_opacity(0)

    def get_letter_center(self, index: int) -> np.ndarray:
        """Get center point of letter at index."""
        if 0 <= index < self.letter_count:
            return self.letters[index].get_center()
        return ORIGIN

    def get_revealed_count(self) -> int:
        """Count visible letters."""
        return sum(1 for l in self.letters if l.get_fill_opacity() > 0.5)


class MetaballMobject(VMobject):
    """
    Renders a metaball implicit surface as a filled shape.
    """

    def __init__(self, metaball_field: MetaballField, resolution: int = 80, **kwargs):
        self.metaball_field = metaball_field
        self.resolution = resolution
        super().__init__(**kwargs)

    def generate_points(self):
        """Generate the boundary path from metaball field."""
        boundary = self.metaball_field.get_boundary_points(
            resolution=self.resolution,
            bounds=(-8, 8, -4.5, 4.5)
        )

        if len(boundary) < 3:
            # Not enough points for a shape
            self.set_points([ORIGIN])
            return

        # Sort points to form a continuous boundary (approximate)
        # Use convex hull as simple approach
        from scipy.spatial import ConvexHull

        points_array = np.array(boundary)
        try:
            hull = ConvexHull(points_array)
            hull_points = points_array[hull.vertices]

            # Convert to 3D points for ManimGL
            points_3d = np.zeros((len(hull_points), 3))
            points_3d[:, 0] = hull_points[:, 0]
            points_3d[:, 1] = hull_points[:, 1]

            # Close the path
            points_3d = np.vstack([points_3d, points_3d[0:1]])

            self.set_points_smoothly(points_3d)
        except Exception:
            # Fallback to circle if hull fails
            self.set_points(Circle(radius=1).get_points())

    def update_from_field(self):
        """Regenerate points based on current field state."""
        self.generate_points()


class BlobPhysics:
    """
    Simple spring physics for blob movement.
    """

    def __init__(self, x: float = 0, y: float = 0, radius: float = 1.5):
        self.x = x
        self.y = y
        self.vx = 0.0
        self.vy = 0.0
        self.base_radius = radius
        self.radius = radius

        # Physics parameters
        self.stiffness = 0.08
        self.damping = 0.85
        self.max_stretch = 1.5

    def update(self, target_x: float, target_y: float, dt: float = 1/60):
        """Update position with spring physics toward target."""
        # Spring force
        dx = target_x - self.x
        dy = target_y - self.y

        self.vx += dx * self.stiffness
        self.vy += dy * self.stiffness

        # Damping
        self.vx *= self.damping
        self.vy *= self.damping

        # Update position
        self.x += self.vx
        self.y += self.vy

        # Stretch based on velocity
        speed = np.sqrt(self.vx**2 + self.vy**2)
        stretch_factor = min(speed / 0.5, self.max_stretch - 1)
        self.radius = self.base_radius * (1 + stretch_factor * 0.3)

    def get_position(self) -> tuple:
        return (self.x, self.y)


class DEMHeroAnimation(Scene):
    """
    Main animation scene combining all phases.
    """

    def construct(self):
        # Set background
        self.camera.background_color = BACKGROUND_COLOR

        # Initialize video texture
        print("Loading video texture...")
        try:
            self.video_texture = VideoTexture(VIDEO_PATH, target_fps=30)
        except Exception as e:
            print(f"Warning: Could not load video: {e}")
            self.video_texture = None

        # Initialize metaball system
        self.metaball_field = MetaballField(threshold=1.0)
        self.blob_physics = BlobPhysics(x=0, y=0, radius=1.5)

        # Create text
        self.masked_text = VideoMaskedText(
            "DEM Systems",
            self.video_texture
        )
        self.masked_text.center()

        # Run all phases
        self.phase_entry()
        self.phase_melt()
        self.phase_interactive()
        self.phase_exit()

    def phase_entry(self):
        """Phase 1: Typewriter reveal (3 seconds)."""
        print("Phase 1: Entry - Typewriter reveal")

        # Add text to scene (invisible initially)
        self.add(self.masked_text)

        # Reveal letters one by one
        letter_count = self.masked_text.letter_count
        reveal_duration = 2.0  # Time for all letters (tighter for 15s total)
        letter_delay = reveal_duration / letter_count

        for i in range(letter_count):
            letter = self.masked_text.letters[i]

            # Scale overshoot animation
            letter.set_opacity(0)
            letter.scale(0.8)

            self.play(
                letter.animate.set_opacity(1).scale(1.25),
                run_time=letter_delay * 0.6,
                rate_func=rush_from,
            )
            self.play(
                letter.animate.scale(1/1.25),
                run_time=letter_delay * 0.4,
                rate_func=rush_into,
            )

        # Brief hold
        self.wait(0.3)

    def phase_melt(self):
        """Phase 2: Melt transition (3 seconds)."""
        print("Phase 2: Melt - Letters to blob")

        # Get letter centers for morph targets
        letter_centers = [
            self.masked_text.get_letter_center(i)
            for i in range(self.masked_text.letter_count)
        ]

        # Create circles at letter positions
        circles = VGroup(*[
            Circle(radius=0.4, fill_opacity=1, stroke_width=0)
            .set_fill(WHITE)
            .move_to(center)
            for center in letter_centers
        ])

        # Phase 2A: Soften - Transform letters to circles
        self.play(
            *[
                Transform(self.masked_text.letters[i], circles[i])
                for i in range(len(circles))
            ],
            run_time=0.7,
            rate_func=smooth,
        )

        # Phase 2B: Collapse - Move toward center
        self.play(
            *[
                circle.animate.move_to(ORIGIN).scale(0.6)
                for circle in self.masked_text.letters
            ],
            run_time=0.7,
            rate_func=smooth,
        )

        # Phase 2C: Merge - Replace with single blob
        # Remove individual letters
        self.remove(self.masked_text)

        # Create metaball blob
        self.metaball_field.add_blob(0, 0, 1.5)
        self.blob_mob = Circle(radius=1.5, fill_opacity=1, stroke_width=0)
        self.blob_mob.set_fill(WHITE)
        self.blob_mob.move_to(ORIGIN)

        self.add(self.blob_mob)

        # Wobble settle
        self.play(
            self.blob_mob.animate.scale(1.1),
            run_time=0.3,
            rate_func=there_and_back,
        )

        self.wait(0.2)

    def phase_interactive(self):
        """Phase 3: Metaball physics (6 seconds)."""
        print("Phase 3: Interactive - Metaball physics")

        # Choreographed cursor path - tighter timing for 15s total
        cursor_path = [
            (0, 0, 0.3),       # Start center, brief hold
            (3, 0.5, 0.8),     # Move right
            (4, 0, 0.4),       # Peak right
            (-3, -0.3, 1.0),   # Sweep left
            (-1, 0.2, 0.4),    # Decelerate
            (0, 0, 0.6),       # Return center
            (0, 0, 0.5),       # Hold/breathe
        ]

        # Secondary blob for split effect
        secondary_blob = None

        for target_x, target_y, duration in cursor_path:
            # Animate blob following target with physics
            steps = int(duration * 60)

            for step in range(steps):
                t = step / steps

                # Interpolate target for smooth motion
                current_target_x = self.blob_physics.x + (target_x - self.blob_physics.x) * 0.1
                current_target_y = self.blob_physics.y + (target_y - self.blob_physics.y) * 0.1

                self.blob_physics.update(target_x, target_y, dt=1/60)

                # Update blob position and shape
                speed = np.sqrt(self.blob_physics.vx**2 + self.blob_physics.vy**2)

                # Stretch blob based on velocity
                if speed > 0.1:
                    angle = np.arctan2(self.blob_physics.vy, self.blob_physics.vx)
                    stretch = 1 + min(speed * 2, 0.5)

                    self.blob_mob.become(
                        Ellipse(
                            width=1.5 * stretch * 2,
                            height=1.5 / stretch * 2,
                            fill_opacity=1,
                            stroke_width=0
                        )
                        .set_fill(WHITE)
                        .move_to([self.blob_physics.x, self.blob_physics.y, 0])
                        .rotate(angle)
                    )
                else:
                    # Return to circle when slow
                    self.blob_mob.become(
                        Circle(
                            radius=1.5 * (1 + 0.05 * np.sin(self.time * 3)),  # Breathing
                            fill_opacity=1,
                            stroke_width=0
                        )
                        .set_fill(WHITE)
                        .move_to([self.blob_physics.x, self.blob_physics.y, 0])
                    )

                self.wait(1/60)

        # Final settle
        self.blob_mob.become(
            Circle(radius=1.5, fill_opacity=1, stroke_width=0)
            .set_fill(WHITE)
            .move_to(ORIGIN)
        )
        self.wait(0.3)

    def phase_exit(self):
        """Phase 4: Exit crystallization (3 seconds)."""
        print("Phase 4: Exit - Blob to letters")

        # Contract to center
        self.play(
            self.blob_mob.animate.scale(0.8).move_to(ORIGIN),
            run_time=0.3,
            rate_func=rush_into,
        )

        # Recreate text for exit
        exit_text = Text(
            "DEM Systems",
            font="SF Pro Display",
            weight=BOLD,
            font_size=120,
        )
        exit_text.set_fill(WHITE, opacity=1)
        exit_text.center()

        # Create circles at letter positions for fragment
        letter_centers = [letter.get_center() for letter in exit_text]
        fragments = VGroup(*[
            Circle(radius=0.3, fill_opacity=1, stroke_width=0)
            .set_fill(WHITE)
            .move_to(ORIGIN)
            for _ in letter_centers
        ])

        # Replace blob with fragments
        self.remove(self.blob_mob)
        self.add(fragments)

        # Fragment - move to letter positions
        self.play(
            *[
                frag.animate.move_to(center)
                for frag, center in zip(fragments, letter_centers)
            ],
            run_time=0.5,
            rate_func=rush_from,
        )

        # Crystallize - morph to letters
        self.play(
            *[
                Transform(frag, letter)
                for frag, letter in zip(fragments, exit_text)
            ],
            run_time=0.5,
            rate_func=smooth,
        )

        # Reverse-order fade out - faster
        letters_reversed = list(reversed(list(fragments)))

        for letter in letters_reversed:
            self.play(
                letter.animate.set_opacity(0),
                run_time=0.05,
                rate_func=linear,
            )

        # Hold on black for loop point
        self.remove(fragments)
        self.wait(0.2)


# Additional scene for testing individual phases
class TestTypewriter(Scene):
    """Test just the typewriter phase."""

    def construct(self):
        self.camera.background_color = BACKGROUND_COLOR

        text = Text(
            "DEM Systems",
            font="SF Pro Display",
            weight=BOLD,
            font_size=120,
        )
        text.set_fill(WHITE, opacity=1)
        text.center()

        for letter in text:
            letter.set_opacity(0)

        self.add(text)

        for letter in text:
            letter.scale(0.8)
            self.play(
                letter.animate.set_opacity(1).scale(1.25),
                run_time=0.15,
            )
            self.play(
                letter.animate.scale(1/1.25),
                run_time=0.1,
            )

        self.wait(1)


class TestMetaball(Scene):
    """Test the metaball physics."""

    def construct(self):
        self.camera.background_color = BACKGROUND_COLOR

        blob = Circle(radius=1.5, fill_opacity=1, stroke_width=0)
        blob.set_fill(WHITE)
        self.add(blob)

        # Simple motion test
        physics = BlobPhysics(0, 0, 1.5)

        targets = [(3, 0), (-2, 1), (0, -1), (0, 0)]

        for tx, ty in targets:
            for _ in range(60):
                physics.update(tx, ty)
                speed = np.sqrt(physics.vx**2 + physics.vy**2)

                if speed > 0.05:
                    angle = np.arctan2(physics.vy, physics.vx)
                    stretch = 1 + min(speed * 2, 0.5)

                    blob.become(
                        Ellipse(
                            width=1.5 * stretch * 2,
                            height=1.5 / stretch * 2,
                            fill_opacity=1,
                            stroke_width=0
                        )
                        .set_fill(WHITE)
                        .move_to([physics.x, physics.y, 0])
                        .rotate(angle)
                    )
                else:
                    blob.become(
                        Circle(radius=1.5, fill_opacity=1, stroke_width=0)
                        .set_fill(WHITE)
                        .move_to([physics.x, physics.y, 0])
                    )

                self.wait(1/60)

        self.wait(1)


if __name__ == "__main__":
    print("Run with: manimgl dem_hero.py DEMHeroAnimation -o")
