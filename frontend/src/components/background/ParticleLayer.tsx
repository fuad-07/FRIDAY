import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function particleCount() {
  if (typeof window === 'undefined') return 100
  const w = window.innerWidth
  if (w < 480) return 30
  if (w < 768) return 50
  return 100
}

interface ParticleLayerProps {
  intensity: number
  reduced: boolean
  tabActive: boolean
}

export function ParticleLayer({ intensity, reduced, tabActive }: ParticleLayerProps) {
  const points = useRef<THREE.Points>(null!)
  const count = useMemo(() => particleCount(), [])

  const [positions, sizes, twinklePhases, driftPhases] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const twinkle = new Float32Array(count)
    const drift = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      siz[i] = Math.random() * 2.0 + 0.3
      twinkle[i] = Math.random() * Math.PI * 2
      drift[i] = Math.random() * Math.PI * 2
    }
    return [pos, siz, twinkle, drift]
  }, [count])

  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.1, 'rgba(230,210,255,0.6)')
    gradient.addColorStop(0.5, 'rgba(180,150,255,0.15)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }, [])

  const speed = reduced ? 0 : 0.015

  useFrame(({ clock }) => {
    if (!points.current || !tabActive) return
    const t = clock.getElapsedTime() * speed
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute
    const arr = pos.array as Float32Array
    const pulse = 1 + intensity * 0.1

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const phase = driftPhases[i]
      arr[i3] += Math.sin(t * 0.4 + phase) * 0.0015 * pulse
      arr[i3 + 1] += Math.cos(t * 0.35 + phase * 1.1) * 0.0015 * pulse
      arr[i3 + 2] += Math.sin(t * 0.3 + phase * 1.3) * 0.001 * pulse

      if (Math.abs(arr[i3]) > 20) arr[i3] *= -0.9
      if (Math.abs(arr[i3 + 1]) > 14) arr[i3 + 1] *= -0.9
      if (Math.abs(arr[i3 + 2]) > 10) arr[i3 + 2] *= -0.9
    }

    const mat = points.current.material as THREE.PointsMaterial
    const twinkle = Math.sin(clock.getElapsedTime() * 0.3 + twinklePhases[0]) * 0.04
    mat.opacity = Math.max(0.05, 0.18 + intensity * 0.06 + twinkle)

    pos.needsUpdate = true
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        map={texture}
        transparent
        opacity={0.18}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        color="#a78bfa"
        sizeAttenuation
      />
    </points>
  )
}
