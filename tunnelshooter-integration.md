# Tunnel Shooter Integration Guide

## Starfox 64 Style Player Controller - Integration Documentation

This document provides comprehensive guidance for integrating the `StarfoxPlayerController` component into an existing React Three.js application.

---

## Table of Contents

1. [Prerequisites Assessment](#prerequisites-assessment)
2. [Dependency Requirements](#dependency-requirements)
3. [Integration Approaches](#integration-approaches)
4. [Step-by-Step Integration](#step-by-step-integration)
5. [Configuration & Customization](#configuration--customization)
6. [Collision System Integration](#collision-system-integration)
7. [State Management Integration](#state-management-integration)
8. [Common Integration Patterns](#common-integration-patterns)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites Assessment

Before integrating the player controller, assess your target codebase for compatibility:

### Required Codebase Analysis

```bash
# Check for existing dependencies
cat package.json | grep -E "(react|three|@react-three)"

# Identify existing Canvas setup
grep -r "Canvas" src/ --include="*.jsx" --include="*.tsx"

# Check for existing game loop patterns
grep -r "useFrame" src/ --include="*.jsx" --include="*.tsx"

# Identify state management approach
grep -r "zustand\|redux\|useContext" src/ --include="*.jsx" --include="*.tsx"
```

### Compatibility Checklist

| Requirement | Minimum Version | Notes |
|------------|-----------------|-------|
| React | 18.0+ | Hooks-based component |
| Three.js | 0.150+ | Uses modern Three.js APIs |
| @react-three/fiber | 8.0+ | Canvas provider required |
| @react-three/drei | 9.0+ | Html, Line components |
| Node.js | 16+ | For development tooling |

---

## Dependency Requirements

### Installation

```bash
# npm
npm install three @react-three/fiber @react-three/drei

# yarn
yarn add three @react-three/fiber @react-three/drei

# pnpm
pnpm add three @react-three/fiber @react-three/drei
```

### TypeScript Support (Optional)

```bash
npm install -D @types/three
```

---

## Integration Approaches

### Approach A: Standalone Drop-in (Recommended for New Projects)

Use the default export for a complete, self-contained experience:

```jsx
import StarfoxPlayerController from './StarfoxPlayerController';

function Game() {
  return <StarfoxPlayerController />;
}
```

### Approach B: Component Composition (Recommended for Existing Projects)

Use named exports to integrate with existing Canvas setup:

```jsx
import { Canvas } from '@react-three/fiber';
import { GameController } from './StarfoxPlayerController';

function Game() {
  return (
    <Canvas>
      {/* Your existing scene elements */}
      <YourExistingLighting />
      <YourExistingSkybox />
      
      {/* Player controller */}
      <GameController onStateUpdate={handleStateUpdate} />
      
      {/* Your enemies, obstacles, etc. */}
      <EnemyManager />
    </Canvas>
  );
}
```

### Approach C: Selective Component Usage

Import individual components for maximum flexibility:

```jsx
import { 
  PlayerShip, 
  Reticle, 
  useInputManager, 
  CONFIG 
} from './StarfoxPlayerController';

function CustomGameController() {
  const input = useInputManager();
  // Implement custom game logic using the input hook
  // and render components as needed
}
```

---

## Step-by-Step Integration

### Step 1: Assess Target Codebase Structure

Identify how your existing codebase handles:

```
Target Codebase Assessment Checklist:
├── Scene Management
│   ├── Single Canvas or Multiple?
│   ├── Scene composition pattern?
│   └── Existing camera controls?
├── State Management
│   ├── Local state / Context / Zustand / Redux?
│   └── How is game state shared?
├── Input Handling
│   ├── Existing input system?
│   └── Conflicts with WASD/Mouse?
├── Game Loop
│   ├── Using useFrame?
│   └── Fixed timestep or variable?
└── Asset Loading
    ├── Using useLoader / useGLTF?
    └── Asset preloading strategy?
```

### Step 2: Copy Component Files

```bash
# Copy to your components directory
cp StarfoxPlayerController.jsx src/components/game/

# Or for TypeScript projects (rename and add types)
cp StarfoxPlayerController.jsx src/components/game/StarfoxPlayerController.tsx
```

### Step 3: Resolve Import Paths

Update imports based on your project structure:

```jsx
// Before
import { CatmullRomCurve3, Vector3, ... } from 'three';

// After (if using path aliases)
import { CatmullRomCurve3, Vector3, ... } from 'three';
// No change needed - three is imported directly

// Drei components
import { Html, Line } from '@react-three/drei';
```

### Step 4: Integrate with Existing Canvas

**If your project has an existing Canvas:**

```jsx
// src/App.jsx (or your main game file)
import { Canvas } from '@react-three/fiber';
import { GameController } from './components/game/StarfoxPlayerController';
import { useGameStore } from './store/gameStore';

function App() {
  const setPlayerState = useGameStore(state => state.setPlayerState);
  
  return (
    <div className="game-container">
      <Canvas camera={{ fov: 75 }}>
        {/* Existing elements */}
        <ambientLight intensity={0.5} />
        <Environment preset="night" />
        
        {/* Player Controller */}
        <GameController 
          onStateUpdate={(state) => {
            setPlayerState(state);
          }} 
        />
        
        {/* Your other game systems */}
        <EnemySystem playerPosition={playerPosition} />
        <ObstacleSystem />
      </Canvas>
    </div>
  );
}
```

**If creating a new Canvas:**

```jsx
import StarfoxPlayerController from './components/game/StarfoxPlayerController';

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <StarfoxPlayerController />
    </div>
  );
}
```

### Step 5: Connect to Your State Management

**Using Zustand (Recommended):**

```jsx
// src/store/gameStore.js
import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  // Player state
  playerPosition: { x: 0, y: 0, z: 0 },
  playerHealth: 100,
  isInvulnerable: false,
  score: 0,
  
  // Actions
  setPlayerState: (state) => set({
    playerPosition: state.position,
    isInvulnerable: state.isInvulnerable,
  }),
  
  takeDamage: (amount) => {
    const { isInvulnerable, playerHealth } = get();
    if (!isInvulnerable) {
      set({ playerHealth: Math.max(0, playerHealth - amount) });
    }
  },
  
  addScore: (points) => set(state => ({ 
    score: state.score + points 
  })),
}));
```

**Using React Context:**

```jsx
// src/context/GameContext.jsx
import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

function gameReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_PLAYER':
      return { ...state, player: action.payload };
    case 'TAKE_DAMAGE':
      if (state.player.isInvulnerable) return state;
      return { 
        ...state, 
        player: { 
          ...state.player, 
          health: state.player.health - action.payload 
        } 
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, {
    player: { health: 100, position: null, isInvulnerable: false }
  });
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
```

---

## Configuration & Customization

### Overriding Default Configuration

Create a modified config for your game:

```jsx
// src/config/gameConfig.js
import { CONFIG as DEFAULT_CONFIG } from '../components/game/StarfoxPlayerController';

export const GAME_CONFIG = {
  ...DEFAULT_CONFIG,
  
  // Custom overrides for your game
  FORWARD_SPEED: 20,      // Faster base speed
  BOOST_SPEED: 50,        // More dramatic boost
  MOVE_BOUNDS: { x: 20, y: 15 }, // Wider play area
  
  // Add your own config
  ENEMY_SPAWN_RATE: 2000,
  BOSS_TRIGGER_DISTANCE: -900,
};
```

### Custom Spline Paths

Replace the default spline with your level design:

```jsx
// src/levels/level1.js
import { Vector3 } from 'three';
import { CatmullRomCurve3 } from 'three';

export function createLevel1Spline() {
  const points = [
    // Starting area - gentle intro
    new Vector3(0, 0, 0),
    new Vector3(0, 0, -50),
    
    // Canyon section
    new Vector3(5, 2, -100),
    new Vector3(-5, 4, -150),
    new Vector3(8, 3, -200),
    new Vector3(-8, 5, -250),
    
    // Open area - enemy waves
    new Vector3(0, 10, -350),
    new Vector3(0, 8, -450),
    
    // Boss approach
    new Vector3(0, 5, -550),
    new Vector3(0, 5, -650),
    new Vector3(0, 5, -750), // Boss fight zone
  ];
  
  return new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

// Level metadata
export const LEVEL_1_CONFIG = {
  spline: createLevel1Spline,
  bossPosition: -750,
  checkpoints: [-200, -450],
  enemyWaves: [
    { position: -100, enemies: ['basic', 'basic', 'basic'] },
    { position: -300, enemies: ['shooter', 'shooter'] },
    { position: -500, enemies: ['heavy'] },
  ],
};
```

### Custom Ship Model Integration

Replace the placeholder cube with your own model:

```jsx
// src/components/game/CustomPlayerShip.jsx
import { useGLTF } from '@react-three/drei';
import { useRef } from 'react';

export function CustomPlayerShip({ 
  position, 
  rotation, 
  isRolling, 
  rollProgress, 
  isBoosting, 
  isInvulnerable 
}) {
  const { nodes, materials } = useGLTF('/models/arwing.glb');
  const shipRef = useRef();
  const rollAngle = isRolling ? rollProgress * Math.PI * 2 : 0;
  
  // Modify material based on state
  const bodyMaterial = materials.body.clone();
  if (isInvulnerable) {
    bodyMaterial.emissive.setHex(0x88ffff);
    bodyMaterial.emissiveIntensity = 0.5;
  } else if (isBoosting) {
    bodyMaterial.emissive.setHex(0xff4400);
    bodyMaterial.emissiveIntensity = 0.3;
  }
  
  return (
    <group ref={shipRef} position={position} rotation={rotation}>
      <group rotation={[0, 0, rollAngle]}>
        <primitive object={nodes.Ship} material={bodyMaterial} />
        
        {/* Engine effect */}
        <mesh position={[0, 0, 1.5]}>
          <coneGeometry args={[0.2, isBoosting ? 3 : 1, 8]} />
          <meshBasicMaterial color={isBoosting ? "#ff4400" : "#ff8800"} />
        </mesh>
      </group>
    </group>
  );
}

useGLTF.preload('/models/arwing.glb');
```

---

## Collision System Integration

### Basic Collision Detection

```jsx
// src/systems/CollisionSystem.jsx
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { Vector3 } from 'three';

export function CollisionSystem({ enemies, obstacles }) {
  const playerPosition = useGameStore(state => state.playerPosition);
  const isInvulnerable = useGameStore(state => state.isInvulnerable);
  const takeDamage = useGameStore(state => state.takeDamage);
  
  useFrame(() => {
    if (isInvulnerable || !playerPosition) return;
    
    const playerPos = new Vector3(
      playerPosition.x,
      playerPosition.y,
      playerPosition.z
    );
    
    // Check enemy collisions
    enemies.forEach(enemy => {
      const distance = playerPos.distanceTo(enemy.position);
      if (distance < 2) { // Collision radius
        takeDamage(10);
        // Handle enemy collision
      }
    });
    
    // Check obstacle collisions
    obstacles.forEach(obstacle => {
      const distance = playerPos.distanceTo(obstacle.position);
      if (distance < obstacle.radius) {
        takeDamage(25);
      }
    });
  });
  
  return null; // System component, no render
}
```

### Projectile Hit Detection

```jsx
// src/systems/ProjectileSystem.jsx
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export function useProjectileHits(projectiles, targets, onHit) {
  const projectilesRef = useRef(projectiles);
  projectilesRef.current = projectiles;
  
  useFrame(() => {
    projectilesRef.current.forEach(projectile => {
      targets.forEach(target => {
        const distance = projectile.position.distanceTo(target.position);
        if (distance < target.hitRadius) {
          onHit(projectile.id, target.id);
        }
      });
    });
  });
}
```

---

## State Management Integration

### Exposing Player State to Game Systems

Modify the `GameController` to emit state updates:

```jsx
// Modified GameController usage
function GameScene() {
  const [playerState, setPlayerState] = useState(null);
  
  return (
    <>
      <GameController 
        onStateUpdate={(state) => {
          setPlayerState(state);
          // state contains: position, isInvulnerable, boostActive, speed
        }}
      />
      
      {/* Pass state to other systems */}
      <EnemyAI playerPosition={playerState?.position} />
      <CameraShake isBoostActive={playerState?.boostActive} />
    </>
  );
}
```

### Adding Custom State

Extend the controller to track additional state:

```jsx
// Extended state in GameController
const [customState, setCustomState] = useState({
  combo: 0,
  lastHitTime: 0,
  powerups: [],
});

// In onStateUpdate callback
onStateUpdate?.({
  position: shipPosition,
  isInvulnerable,
  boostActive,
  speed: currentSpeed,
  // Extended state
  ...customState,
});
```

---

## Common Integration Patterns

### Pattern 1: Level-Based Game

```jsx
function LevelManager() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const levels = [Level1Config, Level2Config, Level3Config];
  
  return (
    <Canvas>
      <GameController 
        spline={levels[currentLevel - 1].spline}
        onLevelComplete={() => setCurrentLevel(c => c + 1)}
      />
      <LevelGeometry level={currentLevel} />
      <EnemySpawner config={levels[currentLevel - 1].enemies} />
    </Canvas>
  );
}
```

### Pattern 2: Endless Runner

```jsx
function EndlessMode() {
  const [distance, setDistance] = useState(0);
  const difficulty = Math.floor(distance / 1000);
  
  return (
    <Canvas>
      <GameController 
        onStateUpdate={(state) => {
          setDistance(Math.abs(state.position.z));
        }}
      />
      <ProceduralTerrain distance={distance} />
      <DynamicSpawner difficulty={difficulty} />
    </Canvas>
  );
}
```

### Pattern 3: Boss Rush

```jsx
function BossRush() {
  const [bossIndex, setBossIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const bosses = [Boss1, Boss2, Boss3];
  const CurrentBoss = bosses[bossIndex];
  
  return (
    <Canvas>
      <GameController 
        boostLocked={true} // Lock boost during boss fights
        onProjectileHit={(position) => {
          // Check if hit boss
        }}
      />
      <CurrentBoss 
        onDeath={() => setBossIndex(i => i + 1)}
        onDamage={(amt) => setBossHealth(h => h - amt)}
      />
    </Canvas>
  );
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Ship not moving | Input not registered | Check if canvas has focus; click on canvas |
| Camera jittering | Multiple camera controls | Remove OrbitControls or other camera systems |
| HUD not visible | Z-index conflict | Ensure Html component's parent has proper stacking |
| Projectiles invisible | Scale too small | Adjust projectile geometry size |
| Gamepad not working | Browser permissions | Check gamepad API permissions |

### Performance Optimization

```jsx
// Reduce re-renders with memo
const MemoizedShip = React.memo(PlayerShip);

// Use refs for frequently updated values
const positionRef = useRef(new Vector3());

// Batch state updates
const [state, setState] = useState({
  boostCooldown: 0,
  dodgeCooldown: 0,
  // ...
});
// Instead of multiple setState calls

// Object pooling for projectiles
const projectilePool = useMemo(() => 
  Array(50).fill(null).map(() => ({
    active: false,
    position: new Vector3(),
    direction: new Vector3(),
  })), 
[]);
```

### Debug Mode

Add debug visualization:

```jsx
function DebugOverlay({ enabled, state }) {
  if (!enabled) return null;
  
  return (
    <Html>
      <pre style={{ 
        position: 'fixed', 
        top: 10, 
        left: 10,
        background: 'rgba(0,0,0,0.8)',
        color: '#0f0',
        padding: 10,
        fontFamily: 'monospace',
        fontSize: 10,
      }}>
        {JSON.stringify(state, null, 2)}
      </pre>
    </Html>
  );
}
```

---

## Quick Reference

### Exported Components

| Export | Type | Description |
|--------|------|-------------|
| `default` | Component | Complete standalone player controller |
| `GameController` | Component | Core game logic (use inside Canvas) |
| `PlayerShip` | Component | Ship mesh with animations |
| `Reticle` | Component | Aiming reticle display |
| `HUD` | Component | HTML overlay UI |
| `useInputManager` | Hook | Keyboard/mouse/gamepad input |
| `createLevelSpline` | Function | Default spline generator |
| `CONFIG` | Object | Configuration constants |

### State Shape

```typescript
interface PlayerState {
  position: Vector3;
  isInvulnerable: boolean;
  boostActive: boolean;
  speed: number;
}
```

### Input Shape

```typescript
interface Input {
  moveX: number;      // -1 to 1
  moveY: number;      // -1 to 1
  aimX: number;       // -1 to 1
  aimY: number;       // -1 to 1
  boost: boolean;
  dodge: boolean;
  fire: boolean;
}
```

---

## Support & Resources

- **Three.js Documentation**: https://threejs.org/docs/
- **React Three Fiber**: https://docs.pmnd.rs/react-three-fiber/
- **Drei Components**: https://github.com/pmndrs/drei

---

*This integration guide covers the most common scenarios. For specific use cases or advanced customization, examine the source component directly and modify as needed.*
