import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AuroraLayer } from './AuroraLayer'
import { MeshLayer } from './MeshLayer'
import { ParticleLayer } from './ParticleLayer'
import { NeuralConnections } from './NeuralConnections'
import { useTabActive, useReducedMotion } from './BackgroundController'

function MouseParallax() {
  const { camera } = useThree()
  const target = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const factor = 0.012
      target.current.x = (e.clientX / window.innerWidth - 0.5) * factor
      target.current.y = (e.clientY / window.innerHeight - 0.5) * factor
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame(() => {
    const dx = target.current.x - camera.position.x
    const dy = -target.current.y - camera.position.y
    camera.position.x += dx * 0.015
    camera.position.y += dy * 0.015
    camera.lookAt(0, 0, 0)
  })

  return null
}

interface SceneProps {
  intensity: number
  reduced: boolean
  tabActive: boolean
  ripple: number
}

function Scene({ intensity, reduced, tabActive, ripple }: SceneProps) {
  return (
    <>
      <AuroraLayer intensity={intensity} reduced={reduced} />
      <MeshLayer intensity={intensity} reduced={reduced} ripple={ripple} />
      <ParticleLayer intensity={intensity} reduced={reduced} tabActive={tabActive} />
      <NeuralConnections intensity={intensity} reduced={reduced} tabActive={tabActive} />
      <MouseParallax />
    </>
  )
}

interface AnimatedBackgroundProps {
  isGenerating?: boolean
  isUploading?: boolean
}

export function AnimatedBackground({ isGenerating = false, isUploading = false }: AnimatedBackgroundProps) {
  const tabActiveRef = useTabActive()
  const reduced = useReducedMotion()
  const [ripple, setRipple] = useState(0)

  const intensity = useMemo(() => (isGenerating ? 1 : 0), [isGenerating])

  useEffect(() => {
    if (isUploading) {
      setRipple(1)
      const decay = setTimeout(() => setRipple(0), 1500)
      return () => clearTimeout(decay)
    }
  }, [isUploading])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 85% 70% at 50% 40%, transparent 0%, transparent 35%, #050505 100%)',
        zIndex: 3,
        pointerEvents: 'none',
      }} />
      <Canvas
        dpr={[1, 1.2]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 12], fov: 50, near: 0.1, far: 40 }}
        style={{ background: '#050505', position: 'absolute', inset: 0 }}
      >
        <Scene
          intensity={intensity}
          reduced={reduced}
          tabActive={tabActiveRef.current}
          ripple={ripple}
        />
      </Canvas>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: [
          'radial-gradient(ellipse 100% 80% at 50% 25%, rgba(76,29,149,0.04) 0%, transparent 60%)',
          'radial-gradient(ellipse 70% 60% at 70% 65%, rgba(79,70,229,0.025) 0%, transparent 60%)',
          'radial-gradient(ellipse 50% 50% at 20% 70%, rgba(30,27,75,0.04) 0%, transparent 50%)',
        ].join(', '),
        zIndex: 2,
        pointerEvents: 'none',
      }} />
    </div>
  )
}
