# Hero--26: AERO Aerial Technology - "IN THE CLOUDS" Hero Section

## Overview
Create a sleek, high-impact HTML5 hero section for **AERO Aerial Tech**, featuring a volumetric cloud video background (`https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/motion_clouds.mp4`), a floating 3D futuristic drone asset (`https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dron_fly.png`) with dynamic mouse flight physics, gradient display typography ("IN THE CLOUDS"), and interactive telemetry spec drawers.

---

## Technical Stack & Dependencies
- **Markup**: HTML5 Semantic Structure
- **Styling**: Tailwind CSS (CDN) + Custom CSS Glassmorphism & Text Gradients
- **Typography**: Google Fonts (`Syne` display font & `Plus Jakarta Sans`)
- **Icons**: Lucide Icons CDN
- **Logic**: Vanilla JavaScript (Mouse Parallax Physics, Cart Counter, Modal Drawer, Mobile Navigation)
- **Cloud Assets**:
  - Background Video: `https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/motion_clouds.mp4`
  - Floating Drone Image: `https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/dron_fly.png`

---

## Design & Layout Features

### 1. Navigation Header
- **Brand Logo**: `AERO` in bold, tracked display typography (`Syne font-extrabold`).
- **Desktop Navigation Links**: Domain-tailored drone categories:
  - `FLEET`: Aerial drone line-up
  - `SPECS`: Directly opens the interactive Aerial Spec Drawer modal
  - `TELEMETRY`: Real-time HUD altitude & flight data
  - `FLIGHT MODES`: Cloud chase, stealth & cinematic flight modes
  - `CUSTOM LAB`: Drone build configurator
- **Right Utilities**: Account profile icon button, interactive shopping bag icon with dynamic numeric badge counter `0`.

### 2. Main Hero Canvas (`#hero-card`)
- **Container**: Large rounded rectangle container (`rounded-[28px]` to `rounded-[44px]`), overflow hidden, crisp border.
- **Background Video**: HTML5 `<video>` playing `https://strvid.nyc3.cdn.digitaloceanspaces.com/motionsite/motion_clouds.mp4` on infinite loop with clean, pristine playback (no darkening background overlays).
- **Floating 3D Drone (`dron_fly.png`)**:
  - Centered floating hover animation (`floatDrone` keyframe).
  - **Dynamic Mouse Parallax Flight Physics**: Full viewport cursor tracking with 3D translation (`moveX` max 115px, `moveY` max 80px), nose pitch tilt (`rotateX` 26°), yaw turning (`rotateY` 32°), wing roll banking (`rotateZ` 14°), and dynamic Z-depth scaling.

### 3. Headline Typography ("IN THE CLOUDS")
- Massive display text in uppercase `Syne` font scaling dynamically across the card (`text-[10.8vw]` to `text-[9.2vw]`).
- Custom gradient fill (`hero-text-blend`) transitioning from pure white to sky-cloud blue tones.
- Optimized container padding and letter-spacing to ensure the letter **"S"** in "CLOUDS" renders fully without clipping.

### 4. Interactive Spec Modal Drawer
- Triggered by clicking the **SPECS** navigation link.
- Displays full drone specs:
  - Max Speed: `180 KM/H`
  - Battery Life: `45 MINUTES`
  - Max Altitude: `12,000 FT`
  - Camera Sensor: `8K CINEMATIC RAW`
- **Add To Reserve List**: Interactive button ($2,499) that increments the header shopping bag counter badge with toast feedback.

### 5. Mobile Navigation
- Full-screen glassmorphic mobile navigation overlay with smooth drawer transitions.
