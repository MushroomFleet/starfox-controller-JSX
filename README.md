# 🚀 Starfox 64 Style Player Controller

<div align="center">

![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**A React Three Fiber component that recreates the iconic rail shooter movement and combat mechanics from Starfox 64**

[Quick Demo](#-quick-demo) • [Features](#-features) • [Installation](#-installation) • [Integration Guide](#-integration) • [Controls](#-controls)

</div>

---

## 🎮 Overview

This component provides a complete player controller system inspired by the classic Nintendo 64 rail shooter **Starfox 64**. The player ship follows an invisible spline path through the level while maintaining full control over lateral and vertical movement, aiming, and combat actions.

Perfect for:
- Rail shooter games
- Tunnel runner experiences  
- Space combat games
- On-rails arcade shooters
- Educational Three.js/React projects

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🛤️ **Spline-Based Movement** | Ship automatically follows a CatmullRom curve while player controls offset position |
| 🚀 **Boost System** | Temporary speed increase (15→35 units/s) with visual feedback and cooldown |
| 🔄 **Barrel Roll** | Iconic dodge maneuver with 360° roll animation, invulnerability frames, and agility boost |
| 🎯 **Independent Aiming** | Reticle moves independently of ship position for precise targeting |
| 🔫 **Rapid-Fire Combat** | Projectiles fire from ship toward reticle with configurable fire rate |
| 🎮 **Dual Input Support** | Full keyboard/mouse AND gamepad support with deadzone handling |
| 📊 **HUD System** | Real-time speed, boost meter, dodge cooldown, and position display |
| ⚙️ **Highly Configurable** | Centralized CONFIG object for easy gameplay tuning |

## 🎬 Quick Demo

Want to see it in action immediately? Open **`demo.html`** in your browser!

The demo is a standalone vanilla Three.js implementation that showcases all features without requiring any build tools or dependencies.

```bash
# Just open in browser
open demo.html
# or
start demo.html  # Windows
```

> **Note:** The demo uses vanilla Three.js for zero-setup preview. The main component (`StarfoxPlayerController.jsx`) is designed for React Three Fiber projects.

## 📦 Installation

### Prerequisites

```bash
npm install three @react-three/fiber @react-three/drei
```

### Add to Your Project

Copy `StarfoxPlayerController.jsx` to your components directory:

```
src/
└── components/
    └── game/
        └── StarfoxPlayerController.jsx
```

## 🚀 Usage

### Quick Start (Standalone)

```jsx
import StarfoxPlayerController from './components/game/StarfoxPlayerController';

function App() {
  return <StarfoxPlayerController />;
}
```

### Integration with Existing Canvas

```jsx
import { Canvas } from '@react-three/fiber';
import { GameController } from './components/game/StarfoxPlayerController';

function Game() {
  const handleStateUpdate = (state) => {
    // Access player position, speed, invulnerability status
    console.log(state.position, state.isInvulnerable);
  };

  return (
    <Canvas camera={{ fov: 75 }}>
      <GameController onStateUpdate={handleStateUpdate} />
      {/* Your other game elements */}
    </Canvas>
  );
}
```

### Selective Imports

```jsx
import { 
  PlayerShip,
  Reticle,
  useInputManager,
  createLevelSpline,
  CONFIG 
} from './components/game/StarfoxPlayerController';

// Build custom implementations using individual pieces
```

## 🎮 Controls

| Action | Keyboard | Gamepad |
|--------|----------|---------|
| **Move Ship** | `W` `A` `S` `D` / Arrow Keys | Left Stick |
| **Aim Reticle** | Mouse Movement | Right Stick |
| **Fire** | Left Click | LT (Left Trigger) |
| **Boost** | `Shift` | RT (Right Trigger) |
| **Barrel Roll** | `Space` / `E` | LB / RB |

## ⚙️ Configuration

All gameplay parameters are centralized in the `CONFIG` object:

```javascript
const CONFIG = {
  // Movement
  MOVE_SPEED: 8,              // Lateral/vertical movement speed
  MOVE_BOUNDS: { x: 12, y: 8 }, // Play area boundaries
  FORWARD_SPEED: 15,          // Base forward speed along spline
  BOOST_SPEED: 35,            // Speed during boost
  BOOST_DURATION: 2000,       // Boost active time (ms)
  BOOST_COOLDOWN: 5000,       // Time between boosts (ms)
  
  // Dodge/Barrel Roll
  DODGE_DURATION: 600,        // Roll animation length (ms)
  DODGE_COOLDOWN: 3000,       // Time between rolls (ms)
  DODGE_AGILITY_MULT: 1.8,    // Movement multiplier during roll
  
  // Weapons
  FIRE_RATE: 100,             // Minimum ms between shots
  PROJECTILE_SPEED: 80,       // Projectile velocity
  PROJECTILE_LIFETIME: 2000,  // Projectile max lifespan (ms)
  
  // Visual
  SHIP_TILT_FACTOR: 0.3,      // Ship banking intensity
  RETICLE_DISTANCE: 50,       // Reticle distance from ship
};
```

## 📖 Integration

For comprehensive integration guidance, including:

- Codebase compatibility assessment
- Step-by-step integration instructions
- State management patterns (Zustand, Context)
- Custom spline/level creation
- Collision system integration
- Common game patterns (level-based, endless, boss rush)
- Troubleshooting and optimization

**See: [`tunnelshooter-integration.md`](./tunnelshooter-integration.md)**

## 🏗️ Architecture

```
StarfoxPlayerController (Default Export)
├── Canvas (React Three Fiber)
│   └── GameController
│       ├── useInputManager() ─── Keyboard/Mouse/Gamepad
│       ├── useFrame() ─── Game Loop
│       │   ├── Cooldown management
│       │   ├── Boost/Dodge logic
│       │   ├── Movement & physics
│       │   ├── Projectile management
│       │   └── Camera following
│       ├── TerrainPlaceholder
│       ├── PlayerShip
│       ├── Reticle
│       ├── Projectile[]
│       └── HUD (Html overlay)
└── State Management (useState/useRef)
```

## 📁 Files

| File | Description |
|------|-------------|
| `StarfoxPlayerController.jsx` | Main React Three Fiber component |
| `demo.html` | Standalone vanilla Three.js demo |
| `tunnelshooter-integration.md` | Comprehensive integration documentation |
| `README.md` | This file |

## 🔧 Exports

| Export | Type | Description |
|--------|------|-------------|
| `default` | Component | Complete standalone controller |
| `GameController` | Component | Core logic (use inside Canvas) |
| `PlayerShip` | Component | Ship mesh with animations |
| `Reticle` | Component | Aiming reticle |
| `HUD` | Component | HTML overlay UI |
| `useInputManager` | Hook | Unified input handling |
| `createLevelSpline` | Function | Default path generator |
| `CONFIG` | Object | Configuration constants |

## 🎯 State Interface

```typescript
interface PlayerState {
  position: Vector3;      // Current world position
  isInvulnerable: boolean; // During barrel roll
  boostActive: boolean;   // Boost engaged
  speed: number;          // Current forward speed
}
```

## 📋 Requirements

- React 18+
- Three.js 0.150+
- @react-three/fiber 8+
- @react-three/drei 9+

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests
- Share your games built with this controller

## 📄 License

MIT License - feel free to use in personal and commercial projects.

---

## 📚 Citation

### Academic Citation

If you use this codebase in your research or project, please cite:

```bibtex
@software{starfox_controller_jsx,
  title = {Starfox Controller JSX: A React Three Fiber rail shooter player controller},
  author = {Drift Johnson},
  year = {2025},
  url = {https://github.com/MushroomFleet/starfox-controller-JSX},
  version = {1.0.0}
}
```

### Donate

[![Ko-Fi](https://cdn.ko-fi.com/cdn/kofi3.png?v=3)](https://ko-fi.com/driftjohnson)

---

<div align="center">

**[⬆ Back to Top](#-starfox-64-style-player-controller)**

*Do a barrel roll!* 🛸

</div>
