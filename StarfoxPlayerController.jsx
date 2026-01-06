import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { CatmullRomCurve3, Vector3, Quaternion, Euler, MathUtils } from 'three';
import { OrbitControls, Html, Trail, Line } from '@react-three/drei';

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================
const CONFIG = {
  // Movement
  MOVE_SPEED: 8,
  MOVE_BOUNDS: { x: 12, y: 8 },
  FORWARD_SPEED: 15,
  BOOST_SPEED: 35,
  BOOST_DURATION: 2000,
  BOOST_COOLDOWN: 5000,
  
  // Dodge/Barrel Roll
  DODGE_DURATION: 600,
  DODGE_COOLDOWN: 3000,
  DODGE_AGILITY_MULT: 1.8,
  
  // Weapons
  FIRE_RATE: 100, // ms between shots
  PROJECTILE_SPEED: 80,
  PROJECTILE_LIFETIME: 2000,
  
  // Visual
  SHIP_TILT_FACTOR: 0.3,
  RETICLE_DISTANCE: 50,
};

// ============================================================================
// INPUT MANAGER HOOK
// ============================================================================
function useInputManager() {
  const [keys, setKeys] = useState({
    up: false, down: false, left: false, right: false,
    boost: false, dodge: false, fire: false
  });
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [gamepad, setGamepad] = useState(null);
  const gamepadRef = useRef({ leftStick: { x: 0, y: 0 }, rightStick: { x: 0, y: 0 }, buttons: {} });

  useEffect(() => {
    const keyMap = {
      'KeyW': 'up', 'ArrowUp': 'up',
      'KeyS': 'down', 'ArrowDown': 'down',
      'KeyA': 'left', 'ArrowLeft': 'left',
      'KeyD': 'right', 'ArrowRight': 'right',
      'ShiftLeft': 'boost', 'ShiftRight': 'boost',
      'Space': 'dodge',
      'KeyE': 'dodge',
    };

    const handleKeyDown = (e) => {
      const action = keyMap[e.code];
      if (action) setKeys(k => ({ ...k, [action]: true }));
    };
    
    const handleKeyUp = (e) => {
      const action = keyMap[e.code];
      if (action) setKeys(k => ({ ...k, [action]: false }));
    };

    const handleMouseMove = (e) => {
      setMouse({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      });
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) setKeys(k => ({ ...k, fire: true }));
    };
    
    const handleMouseUp = (e) => {
      if (e.button === 0) setKeys(k => ({ ...k, fire: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Gamepad polling
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      const gp = gamepads[0];
      if (gp) {
        gamepadRef.current = {
          leftStick: { x: gp.axes[0] || 0, y: gp.axes[1] || 0 },
          rightStick: { x: gp.axes[2] || 0, y: gp.axes[3] || 0 },
          buttons: {
            boost: gp.buttons[7]?.pressed || false, // RT
            dodge: gp.buttons[4]?.pressed || gp.buttons[5]?.pressed || false, // LB/RB
            fire: gp.buttons[6]?.pressed || false, // LT
          }
        };
        setGamepad(gamepadRef.current);
      }
    };
    
    const gamepadInterval = setInterval(pollGamepad, 16);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      clearInterval(gamepadInterval);
    };
  }, []);

  // Combine keyboard and gamepad inputs
  const input = useMemo(() => {
    const gp = gamepadRef.current;
    const deadzone = 0.15;
    
    const applyDeadzone = (val) => Math.abs(val) < deadzone ? 0 : val;
    
    return {
      moveX: applyDeadzone(gp.leftStick?.x || 0) || (keys.left ? -1 : keys.right ? 1 : 0),
      moveY: applyDeadzone(-(gp.leftStick?.y || 0)) || (keys.up ? 1 : keys.down ? -1 : 0),
      aimX: applyDeadzone(gp.rightStick?.x || 0) || mouse.x,
      aimY: applyDeadzone(-(gp.rightStick?.y || 0)) || mouse.y,
      boost: keys.boost || gp.buttons?.boost || false,
      dodge: keys.dodge || gp.buttons?.dodge || false,
      fire: keys.fire || gp.buttons?.fire || false,
    };
  }, [keys, mouse, gamepad]);

  return input;
}

// ============================================================================
// SPLINE PATH
// ============================================================================
function createLevelSpline() {
  const points = [
    new Vector3(0, 0, 0),
    new Vector3(0, 2, -100),
    new Vector3(10, 5, -200),
    new Vector3(-5, 3, -300),
    new Vector3(0, 8, -400),
    new Vector3(15, 4, -500),
    new Vector3(-10, 6, -600),
    new Vector3(0, 2, -700),
    new Vector3(5, 10, -800),
    new Vector3(0, 5, -1000),
  ];
  return new CatmullRomCurve3(points, false, 'catmullrom', 0.5);
}

// ============================================================================
// PROJECTILE COMPONENT
// ============================================================================
function Projectile({ position, direction, onExpire, id }) {
  const ref = useRef();
  const startTime = useRef(Date.now());
  
  useFrame((_, delta) => {
    if (!ref.current) return;
    
    ref.current.position.add(
      direction.clone().multiplyScalar(CONFIG.PROJECTILE_SPEED * delta)
    );
    
    if (Date.now() - startTime.current > CONFIG.PROJECTILE_LIFETIME) {
      onExpire(id);
    }
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#00ff88" emissive="#00ff88" />
      <pointLight color="#00ff88" intensity={2} distance={5} />
    </mesh>
  );
}

// ============================================================================
// PLAYER SHIP COMPONENT
// ============================================================================
function PlayerShip({ 
  position, 
  rotation, 
  isRolling, 
  rollProgress, 
  isBoosting,
  isInvulnerable 
}) {
  const shipRef = useRef();
  const rollAngle = isRolling ? rollProgress * Math.PI * 2 : 0;
  
  return (
    <group ref={shipRef} position={position} rotation={rotation}>
      <group rotation={[0, 0, rollAngle]}>
        {/* Main body - placeholder cube */}
        <mesh>
          <boxGeometry args={[1.5, 0.5, 2]} />
          <meshStandardMaterial 
            color={isInvulnerable ? "#88ffff" : isBoosting ? "#ff8844" : "#4488ff"} 
            emissive={isInvulnerable ? "#448888" : isBoosting ? "#442200" : "#112244"}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        {/* Wings */}
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[1.5, 0.1, 1]} />
          <meshStandardMaterial color="#3366cc" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[1.5, 0.1, 1]} />
          <meshStandardMaterial color="#3366cc" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Cockpit */}
        <mesh position={[0, 0.3, -0.3]}>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#88ccff" transparent opacity={0.7} />
        </mesh>
        
        {/* Engine glow */}
        <mesh position={[0, 0, 1.2]}>
          <coneGeometry args={[0.3, isBoosting ? 2 : 0.8, 8]} />
          <meshBasicMaterial color={isBoosting ? "#ff4400" : "#ff8800"} />
        </mesh>
        <pointLight 
          position={[0, 0, 1.5]} 
          color={isBoosting ? "#ff4400" : "#ff8800"} 
          intensity={isBoosting ? 5 : 2} 
          distance={isBoosting ? 8 : 4} 
        />
      </group>
    </group>
  );
}

// ============================================================================
// RETICLE COMPONENT
// ============================================================================
function Reticle({ position, isLocked }) {
  const ref = useRef();
  
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z += delta * 2;
    }
  });

  return (
    <group position={position} ref={ref}>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.8, 1, 4]} />
        <meshBasicMaterial color={isLocked ? "#ff0000" : "#00ff00"} transparent opacity={0.8} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <ringGeometry args={[0.5, 0.6, 4]} />
        <meshBasicMaterial color={isLocked ? "#ff0000" : "#00ff00"} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ============================================================================
// HUD OVERLAY COMPONENT
// ============================================================================
function HUD({ 
  boostCooldown, 
  boostActive, 
  dodgeCooldown, 
  isInvulnerable,
  speed,
  position 
}) {
  const boostPercent = Math.max(0, 100 - (boostCooldown / CONFIG.BOOST_COOLDOWN) * 100);
  const dodgePercent = Math.max(0, 100 - (dodgeCooldown / CONFIG.DODGE_COOLDOWN) * 100);
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: '"Courier New", monospace',
      color: '#00ff88',
      textShadow: '0 0 10px #00ff88',
    }}>
      {/* Speed indicator */}
      <div style={{
        position: 'absolute',
        left: 20,
        top: '50%',
        transform: 'translateY(-50%)',
      }}>
        <div style={{ fontSize: 14, marginBottom: 5 }}>SPEED</div>
        <div style={{
          width: 20,
          height: 200,
          border: '2px solid #00ff88',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: `${(speed / CONFIG.BOOST_SPEED) * 100}%`,
            background: boostActive ? '#ff4400' : '#00ff88',
            transition: 'height 0.1s',
          }} />
        </div>
        <div style={{ fontSize: 12, marginTop: 5 }}>{Math.round(speed)}</div>
      </div>
      
      {/* Boost meter */}
      <div style={{
        position: 'absolute',
        right: 20,
        top: 20,
      }}>
        <div style={{ fontSize: 14, marginBottom: 5 }}>
          BOOST {boostActive ? '[ACTIVE]' : boostPercent >= 100 ? '[READY]' : ''}
        </div>
        <div style={{
          width: 150,
          height: 15,
          border: '2px solid #00ff88',
          position: 'relative',
        }}>
          <div style={{
            width: `${boostPercent}%`,
            height: '100%',
            background: boostActive ? '#ff4400' : boostPercent >= 100 ? '#00ff88' : '#448844',
            transition: 'width 0.1s',
          }} />
        </div>
        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>SHIFT / RT</div>
      </div>
      
      {/* Dodge meter */}
      <div style={{
        position: 'absolute',
        right: 20,
        top: 80,
      }}>
        <div style={{ fontSize: 14, marginBottom: 5 }}>
          BARREL ROLL {isInvulnerable ? '[ROLLING]' : dodgePercent >= 100 ? '[READY]' : ''}
        </div>
        <div style={{
          width: 150,
          height: 15,
          border: '2px solid #00ff88',
          position: 'relative',
        }}>
          <div style={{
            width: `${dodgePercent}%`,
            height: '100%',
            background: isInvulnerable ? '#88ffff' : dodgePercent >= 100 ? '#00ff88' : '#448844',
            transition: 'width 0.1s',
          }} />
        </div>
        <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>SPACE / LB/RB</div>
      </div>
      
      {/* Controls help */}
      <div style={{
        position: 'absolute',
        left: 20,
        bottom: 20,
        fontSize: 11,
        opacity: 0.7,
      }}>
        <div>WASD / Left Stick - Move</div>
        <div>Mouse / Right Stick - Aim</div>
        <div>Click / LT - Fire</div>
        <div>SHIFT / RT - Boost</div>
        <div>SPACE / LB - Barrel Roll</div>
      </div>
      
      {/* Position readout */}
      <div style={{
        position: 'absolute',
        right: 20,
        bottom: 20,
        fontSize: 12,
        textAlign: 'right',
      }}>
        <div>X: {position.x.toFixed(1)}</div>
        <div>Y: {position.y.toFixed(1)}</div>
        <div>Z: {position.z.toFixed(1)}</div>
      </div>
      
      {/* Crosshair center */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: '#00ff88',
        boxShadow: '0 0 10px #00ff88',
      }} />
    </div>
  );
}

// ============================================================================
// TERRAIN PLACEHOLDER
// ============================================================================
function TerrainPlaceholder({ spline }) {
  const points = useMemo(() => spline.getPoints(100), [spline]);
  
  return (
    <group>
      {/* Ground plane segments following spline */}
      {points.map((point, i) => (
        <mesh 
          key={i} 
          position={[point.x, point.y - 15, point.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[60, 15]} />
          <meshStandardMaterial 
            color="#224422" 
            wireframe={false}
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
      
      {/* Spline visualization */}
      <Line
        points={points}
        color="#444488"
        lineWidth={1}
        transparent
        opacity={0.3}
      />
    </group>
  );
}

// ============================================================================
// MAIN GAME CONTROLLER
// ============================================================================
function GameController({ onStateUpdate }) {
  const input = useInputManager();
  const { camera, viewport } = useThree();
  
  // Game state
  const spline = useMemo(() => createLevelSpline(), []);
  const [splineProgress, setSplineProgress] = useState(0);
  const [localOffset, setLocalOffset] = useState({ x: 0, y: 0 });
  const [projectiles, setProjectiles] = useState([]);
  
  // Cooldowns and state
  const [boostCooldown, setBoostCooldown] = useState(0);
  const [boostActive, setBoostActive] = useState(false);
  const [dodgeCooldown, setDodgeCooldown] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [rollProgress, setRollProgress] = useState(0);
  const [isInvulnerable, setIsInvulnerable] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(CONFIG.FORWARD_SPEED);
  
  // Refs for smooth updates
  const lastFireTime = useRef(0);
  const boostStartTime = useRef(0);
  const dodgeStartTime = useRef(0);
  const shipRotation = useRef(new Euler(0, Math.PI, 0));
  const targetRotation = useRef(new Euler(0, Math.PI, 0));
  
  // Calculate positions
  const splinePosition = useMemo(() => {
    return spline.getPointAt(Math.min(splineProgress, 0.999));
  }, [spline, splineProgress]);
  
  const shipPosition = useMemo(() => {
    return new Vector3(
      splinePosition.x + localOffset.x,
      splinePosition.y + localOffset.y,
      splinePosition.z
    );
  }, [splinePosition, localOffset]);
  
  // Reticle position (in front of ship, offset by aim)
  const reticlePosition = useMemo(() => {
    return new Vector3(
      shipPosition.x + input.aimX * 15,
      shipPosition.y + input.aimY * 10,
      shipPosition.z - CONFIG.RETICLE_DISTANCE
    );
  }, [shipPosition, input.aimX, input.aimY]);

  // Fire projectile
  const fireProjectile = useCallback(() => {
    const now = Date.now();
    if (now - lastFireTime.current < CONFIG.FIRE_RATE) return;
    lastFireTime.current = now;
    
    const direction = new Vector3()
      .subVectors(reticlePosition, shipPosition)
      .normalize();
    
    const newProjectile = {
      id: now + Math.random(),
      position: shipPosition.clone(),
      direction: direction,
    };
    
    setProjectiles(prev => [...prev, newProjectile]);
  }, [shipPosition, reticlePosition]);

  // Remove projectile
  const removeProjectile = useCallback((id) => {
    setProjectiles(prev => prev.filter(p => p.id !== id));
  }, []);

  // Main game loop
  useFrame((state, delta) => {
    const now = Date.now();
    
    // Update cooldowns
    if (boostCooldown > 0) {
      setBoostCooldown(prev => Math.max(0, prev - delta * 1000));
    }
    if (dodgeCooldown > 0) {
      setDodgeCooldown(prev => Math.max(0, prev - delta * 1000));
    }
    
    // Handle boost
    if (input.boost && boostCooldown === 0 && !boostActive) {
      setBoostActive(true);
      boostStartTime.current = now;
    }
    
    if (boostActive) {
      if (now - boostStartTime.current > CONFIG.BOOST_DURATION) {
        setBoostActive(false);
        setBoostCooldown(CONFIG.BOOST_COOLDOWN);
      }
    }
    
    // Handle dodge/barrel roll
    if (input.dodge && dodgeCooldown === 0 && !isRolling) {
      setIsRolling(true);
      setIsInvulnerable(true);
      dodgeStartTime.current = now;
      setRollProgress(0);
    }
    
    if (isRolling) {
      const rollElapsed = now - dodgeStartTime.current;
      const progress = Math.min(rollElapsed / CONFIG.DODGE_DURATION, 1);
      setRollProgress(progress);
      
      if (progress >= 1) {
        setIsRolling(false);
        setIsInvulnerable(false);
        setDodgeCooldown(CONFIG.DODGE_COOLDOWN);
      }
    }
    
    // Calculate speed
    const speed = boostActive ? CONFIG.BOOST_SPEED : CONFIG.FORWARD_SPEED;
    setCurrentSpeed(speed);
    
    // Update spline progress
    const splineLength = spline.getLength();
    const progressDelta = (speed * delta) / splineLength;
    setSplineProgress(prev => {
      const next = prev + progressDelta;
      return next >= 1 ? 0 : next; // Loop back
    });
    
    // Update local offset (movement on the plane)
    const agilityMult = isRolling ? CONFIG.DODGE_AGILITY_MULT : 1;
    setLocalOffset(prev => ({
      x: MathUtils.clamp(
        prev.x + input.moveX * CONFIG.MOVE_SPEED * delta * agilityMult,
        -CONFIG.MOVE_BOUNDS.x,
        CONFIG.MOVE_BOUNDS.x
      ),
      y: MathUtils.clamp(
        prev.y + input.moveY * CONFIG.MOVE_SPEED * delta * agilityMult,
        -CONFIG.MOVE_BOUNDS.y,
        CONFIG.MOVE_BOUNDS.y
      ),
    }));
    
    // Update ship rotation (tilt based on movement)
    targetRotation.current.set(
      -input.moveY * CONFIG.SHIP_TILT_FACTOR,
      Math.PI,
      input.moveX * CONFIG.SHIP_TILT_FACTOR * 1.5
    );
    
    shipRotation.current.x = MathUtils.lerp(shipRotation.current.x, targetRotation.current.x, 0.1);
    shipRotation.current.z = MathUtils.lerp(shipRotation.current.z, targetRotation.current.z, 0.1);
    
    // Handle firing
    if (input.fire) {
      fireProjectile();
    }
    
    // Update camera to follow ship
    const cameraOffset = new Vector3(0, 5, 15);
    const targetCameraPos = shipPosition.clone().add(cameraOffset);
    camera.position.lerp(targetCameraPos, 0.05);
    camera.lookAt(shipPosition.x, shipPosition.y, shipPosition.z - 20);
    
    // Report state
    if (onStateUpdate) {
      onStateUpdate({
        position: shipPosition,
        isInvulnerable,
        boostActive,
        speed: currentSpeed,
      });
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={1} />
      <pointLight position={shipPosition.toArray()} color="#4488ff" intensity={0.5} distance={10} />
      
      {/* Terrain */}
      <TerrainPlaceholder spline={spline} />
      
      {/* Player ship */}
      <PlayerShip
        position={shipPosition}
        rotation={[shipRotation.current.x, shipRotation.current.y, shipRotation.current.z]}
        isRolling={isRolling}
        rollProgress={rollProgress}
        isBoosting={boostActive}
        isInvulnerable={isInvulnerable}
      />
      
      {/* Reticle */}
      <Reticle position={reticlePosition} isLocked={false} />
      
      {/* Projectiles */}
      {projectiles.map(proj => (
        <Projectile
          key={proj.id}
          id={proj.id}
          position={proj.position.clone()}
          direction={proj.direction}
          onExpire={removeProjectile}
        />
      ))}
      
      {/* HUD */}
      <Html fullscreen>
        <HUD
          boostCooldown={boostCooldown}
          boostActive={boostActive}
          dodgeCooldown={dodgeCooldown}
          isInvulnerable={isInvulnerable}
          speed={currentSpeed}
          position={shipPosition}
        />
      </Html>
    </>
  );
}

// ============================================================================
// MAIN EXPORT COMPONENT
// ============================================================================
export default function StarfoxPlayerController() {
  const [gameState, setGameState] = useState(null);
  
  return (
    <div style={{ width: '100%', height: '100vh', background: '#000011' }}>
      <Canvas
        camera={{ position: [0, 5, 15], fov: 75 }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={['#000022', 50, 200]} />
        <GameController onStateUpdate={setGameState} />
      </Canvas>
    </div>
  );
}

// ============================================================================
// NAMED EXPORTS FOR INTEGRATION
// ============================================================================
export {
  GameController,
  PlayerShip,
  Reticle,
  HUD,
  useInputManager,
  createLevelSpline,
  CONFIG,
};
