import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAX_LINES = 25
const CONNECT_DISTANCE = 12

interface NeuralConnectionsProps {
  intensity: number
  reduced: boolean
  tabActive: boolean
}

export function NeuralConnections({ intensity, reduced, tabActive }: NeuralConnectionsProps) {
  const lineRef = useRef<THREE.LineSegments>(null!)

  const geometry = useMemo(() => {
    const pos = new Float32Array(MAX_LINES * 6)
    const alpha = new Float32Array(MAX_LINES * 2)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1))
    return geo
  }, [])

  const lineTimers = useRef<Float32Array>(new Float32Array(MAX_LINES))
  const linePairs = useRef<Array<[number, number]>>([])

  function initConnections() {
    const pairs: Array<[number, number]> = []
    for (let i = 0; i < MAX_LINES; i++) {
      pairs.push([-1, -1])
    }
    linePairs.current = pairs
  }
  initConnections()

  useFrame(({ clock }) => {
    if (!lineRef.current || !tabActive) return
    if (reduced) {
      lineRef.current.geometry.setDrawRange(0, 0)
      return
    }

    const t = clock.getElapsedTime()
    const posAttr = lineRef.current.geometry.attributes.position as THREE.BufferAttribute
    const alphaAttr = lineRef.current.geometry.attributes.alpha as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const alphaArr = alphaAttr.array as Float32Array
    const timers = lineTimers.current

    const pointsObj = lineRef.current.parent?.children.find((c) => c.type === 'Points')
    if (!pointsObj) return

    const segPos = (pointsObj as THREE.Points).geometry.attributes.position.array as Float32Array
    const particleCount = (segPos.length / 3)

    for (let l = 0; l < MAX_LINES; l++) {
      const [i, j] = linePairs.current[l]

      if (i < 0 || j < 0) continue

      const i3 = i * 3
      const j3 = j * 3
      const dx = segPos[i3] - segPos[j3]
      const dy = segPos[i3 + 1] - segPos[j3 + 1]
      const dz = segPos[i3 + 2] - segPos[j3 + 2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      const maxDist = CONNECT_DISTANCE + intensity * 1.5
      if (dist > maxDist) {
        timers[l] = -1
        linePairs.current[l] = [-1, -1]
        continue
      }

      const lifetime = t - timers[l]
      const fadeIn = 0.6
      const hold = 2.0
      const fadeOut = 0.8
      let alpha = 0

      if (lifetime < fadeIn) {
        alpha = lifetime / fadeIn
      } else if (lifetime < fadeIn + hold) {
        alpha = 1
      } else if (lifetime < fadeIn + hold + fadeOut) {
        alpha = 1 - (lifetime - fadeIn - hold) / fadeOut
      } else {
        timers[l] = -1
        linePairs.current[l] = [-1, -1]
        alpha = 0
      }

      const li3 = l * 6
      arr[li3] = segPos[i3]
      arr[li3 + 1] = segPos[i3 + 1]
      arr[li3 + 2] = segPos[i3 + 2]
      arr[li3 + 3] = segPos[j3]
      arr[li3 + 4] = segPos[j3 + 1]
      arr[li3 + 5] = segPos[j3 + 2]

      const maxAlpha = 0.04 + intensity * 0.03
      const finalAlpha = alpha * maxAlpha * (1 - dist / maxDist)
      alphaArr[l * 2] = finalAlpha
      alphaArr[l * 2 + 1] = finalAlpha
    }

    for (let l = 0; l < MAX_LINES; l++) {
      if (linePairs.current[l][0] < 0 || timers[l] < 0) {
        const shouldCreate = Math.random() < 0.008
        if (shouldCreate) {
          const i = Math.floor(Math.random() * particleCount)
          const j = Math.floor(Math.random() * particleCount)
          if (i !== j) {
            const i3 = i * 3
            const j3 = j * 3
            const dx = segPos[i3] - segPos[j3]
            const dy = segPos[i3 + 1] - segPos[j3 + 1]
            const dz = segPos[i3 + 2] - segPos[j3 + 2]
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
            if (dist < CONNECT_DISTANCE + intensity * 1.5) {
              linePairs.current[l] = [i, j]
              timers[l] = t
            }
          }
        }
      }
    }

    posAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    let activeCount = 0
    for (let l = 0; l < MAX_LINES; l++) {
      if (linePairs.current[l][0] >= 0) activeCount++
    }
    lineRef.current.geometry.setDrawRange(0, activeCount * 2)
  })

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#6d28d9" transparent opacity={1} depthWrite={false} />
    </lineSegments>
  )
}
