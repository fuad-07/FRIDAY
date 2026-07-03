import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SEGMENTS = 80

interface MeshLayerProps {
  intensity: number
  reduced: boolean
  ripple?: number
}

export function MeshLayer({ intensity, reduced, ripple = 0 }: MeshLayerProps) {
  const mesh = useRef<THREE.Mesh>(null!)
  const baseRef = useRef<Float32Array | null>(null)
  const speed = reduced ? 0 : 0.035

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(32, 12, SEGMENTS, SEGMENTS)
    geo.rotateX(-Math.PI / 2)
    return geo
  }, [])

  useEffect(() => {
    const pos = geometry.attributes.position.array as Float32Array
    baseRef.current = new Float32Array(pos)
  }, [geometry])

  useFrame(({ clock }) => {
    if (!mesh.current || !baseRef.current) return
    const t = clock.getElapsedTime() * speed
    const pos = mesh.current.geometry.attributes.position as THREE.BufferAttribute
    const array = pos.array as Float32Array
    const base = baseRef.current

    const amp = 0.2 + intensity * 0.08
    const waveSpeed = 0.4 + intensity * 0.05

    for (let i = 0; i < array.length; i += 3) {
      const x = base[i]
      const z = base[i + 2]
      const baseY = base[i + 1]

      const wave = Math.sin(x * waveSpeed * 0.4 + t * 0.8) * amp * 0.6
        + Math.sin(z * waveSpeed * 0.35 + t * 0.6) * amp * 0.4
        + Math.sin((x + z) * waveSpeed * 0.25 + t * 0.5) * amp * 0.3
        + Math.sin(x * waveSpeed * 0.55 + z * waveSpeed * 0.3 + t * 0.7) * amp * 0.2

      const rippleWave = ripple > 0
        ? Math.sin(Math.sqrt(x * x + z * z) * 0.5 - clock.getElapsedTime() * 2) * ripple * 0.3 * Math.exp(-Math.abs(Math.sqrt(x * x + z * z)) * 0.05)
        : 0

      array[i + 1] = baseY + wave + rippleWave
    }

    pos.needsUpdate = true
  })

  const opacity = reduced ? 0.04 : 0.10 + intensity * 0.05

  return (
    <mesh ref={mesh} geometry={geometry} position={[0, -2.5, 0]}>
      <meshBasicMaterial
        color="#4c1d95"
        wireframe
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  )
}
