import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpring, animated } from 'react-spring'

// Asteroid component that renders individual asteroids
function Asteroid({ position, size, color, speed, rotationSpeed, wireframe }: {
    position: [number, number, number],
    size: number,
    color: string,
    speed: number,
    rotationSpeed: [number, number, number],
    wireframe: boolean
}) {
    const meshRef = useRef<THREE.Mesh>(null)

    // Randomly determine asteroid shape complexity
    const detail = useMemo(() => Math.floor(Math.random() * 2) + 1, [])

    // Create geometry with random seed for unique shapes
    const geometry = useMemo(() => {
        const geo = new THREE.IcosahedronGeometry(size, detail)
        // Add some noise to vertices for more asteroid-like appearance
        const positionAttribute = geo.getAttribute('position')
        const positions = positionAttribute.array

        for (let i = 0; i < positions.length; i += 3) {
            const noise = 0.3
            positions[i] += (Math.random() - 0.5) * noise * size
            positions[i + 1] += (Math.random() - 0.5) * noise * size
            positions[i + 2] += (Math.random() - 0.5) * noise * size
        }

        positionAttribute.needsUpdate = true
        geo.computeVertexNormals()
        return geo
    }, [size, detail])

    // Animation loop for movement and rotation
    useFrame((_state, delta) => {
        if (meshRef.current) {
            // Move asteroid towards camera (z-axis)
            meshRef.current.position.z += speed * delta

            // Rotate asteroid
            meshRef.current.rotation.x += rotationSpeed[0] * delta
            meshRef.current.rotation.y += rotationSpeed[1] * delta
            meshRef.current.rotation.z += rotationSpeed[2] * delta

            // Reset position if asteroid goes past camera
            if (meshRef.current.position.z > 10) {
                meshRef.current.position.z = -30 - Math.random() * 10
                meshRef.current.position.x = (Math.random() - 0.5) * 30
                meshRef.current.position.y = (Math.random() - 0.5) * 20
            }
        }
    })

    // For regular solid asteroids
    if (!wireframe) {
        return (
            <mesh ref={meshRef} position={position} geometry={geometry}>
                <meshStandardMaterial
                    color={color}
                    roughness={0.9}
                    metalness={0.1}
                    flatShading={true} // More retro look with flat shading
                />
            </mesh>
        )
    }

    // For wireframe asteroids (more retro)
    return (
        <mesh ref={meshRef} position={position} geometry={geometry}>
            <meshBasicMaterial
                color={color}
                wireframe={true}
                wireframeLinewidth={1}
            />
        </mesh>
    )
}

// A grid component to add to the retro feel
function RetroGrid() {
    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
            <planeGeometry args={[60, 60, 10, 10]} />
            <meshBasicMaterial color="#00ff00" wireframe={true} transparent opacity={0.2} />
        </mesh>
    )
}

type ColorScheme = {
    baseHue: number
    complementaryHue: number
    baseSaturation: number
    baseLightness: number
    screenSaturation: number
    screenLightness: number
}

export default function RetroAsteroids({ colorScheme }: { colorScheme: ColorScheme }) {
    // Generate asteroids with random properties
    const asteroidCount = 20 // Reduced for better performance
    const asteroids = useMemo(() => {
        return Array.from({ length: asteroidCount }).map((_, i) => {
            const isWireframe = Math.random() > 0.5 // 50% wireframe for retro look
            return {
                position: [
                    (Math.random() - 0.5) * 30, // x-position
                    (Math.random() - 0.5) * 20, // y-position
                    -30 - Math.random() * 30,   // z-position (start far away)
                ] as [number, number, number],
                size: Math.random() * 0.8 + 0.3,
                speed: Math.random() * 5 + 2,
                color: isWireframe
                    ? `hsl(${colorScheme.complementaryHue}, 100%, 60%)` // Brighter for wireframes
                    : `hsl(${colorScheme.baseHue}, 70%, 40%)`,          // Darker for solids
                rotationSpeed: [
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                    (Math.random() - 0.5) * 0.5,
                ] as [number, number, number],
                wireframe: isWireframe,
                id: i,
            }
        })
    }, [colorScheme])

    // Spring animation for fading in
    const fadeIn = useSpring({
        from: { opacity: 0 },
        to: { opacity: 0.8 },
        config: { duration: 2000 },
    })

    return (
        <animated.div
            style={{
                ...fadeIn,
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none', // Allow clicks to pass through
                zIndex: 0, // Behind content
            }}
        >
            <Canvas
                camera={{ position: [0, 0, 5], fov: 75 }}
                dpr={[1, 1.5]} // Lower for better performance
                performance={{ min: 0.5 }} // Better mobile performance
            >
                <ambientLight intensity={0.3} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <RetroGrid />
                {asteroids.map((asteroid) => (
                    <Asteroid
                        key={asteroid.id}
                        position={asteroid.position}
                        size={asteroid.size}
                        color={asteroid.color}
                        speed={asteroid.speed}
                        rotationSpeed={asteroid.rotationSpeed}
                        wireframe={asteroid.wireframe}
                    />
                ))}
            </Canvas>
        </animated.div>
    )
} 