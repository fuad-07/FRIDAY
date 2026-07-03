import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uIntensity;
uniform float uReduced;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  float aspect = 1.0;

  vec3 black = vec3(0.0196, 0.0196, 0.0196);
  vec3 deepPurple = vec3(0.141, 0.024, 0.271);
  vec3 indigo = vec3(0.118, 0.106, 0.294);
  vec3 darkBlue = vec3(0.047, 0.047, 0.102);

  float t = uTime * 0.03;

  float band1 = sin(uv.y * 5.0 + t * 0.6 + uv.x * 0.8) * 0.5 + 0.5;
  float band2 = sin(uv.y * 3.5 - t * 0.4 + uv.x * 1.2 + 1.2) * 0.5 + 0.5;
  float band3 = sin(uv.y * 7.0 + t * 0.5 + uv.x * 0.5 + 2.5) * 0.5 + 0.5;
  float band4 = sin((uv.y + uv.x * 0.3) * 9.0 - t * 0.35) * 0.5 + 0.5;

  float mask = sin(uv.y * 2.5 + t * 0.2) * 0.3 + 0.7;
  mask *= 1.0 - abs(uv.y - 0.5) * 1.2;
  mask *= 1.0 - abs(uv.x - 0.5) * 0.8;
  mask = clamp(mask, 0.0, 1.0);

  float blend1 = band1 * band2 * 0.7 + band3 * 0.3;
  float blend2 = band2 * band4 * 0.6 + band1 * 0.4;

  vec3 color1 = mix(deepPurple, indigo, blend1);
  vec3 color2 = mix(indigo, darkBlue, blend2);
  vec3 finalColor = mix(color1, color2, 0.5 + 0.5 * sin(t * 0.3 + uv.y * 2.0));
  finalColor = mix(black, finalColor, mask * 0.5);

  float edge = 1.0 - abs(uv.x - 0.5) * 2.0;
  edge = pow(edge, 0.6);
  float centerFade = 1.0 - abs(uv.y - 0.5) * 2.0;
  centerFade = pow(centerFade, 0.5);

  float alpha = mask * 0.15 * edge * centerFade;
  alpha *= (0.8 + uIntensity * 0.2);

  if (uReduced > 0.5) alpha *= 0.3;

  gl_FragColor = vec4(finalColor, alpha);
}
`

interface AuroraLayerProps {
  intensity: number
  reduced: boolean
}

export function AuroraLayer({ intensity, reduced }: AuroraLayerProps) {
  const mesh = useRef<THREE.Mesh>(null!)
  const uniformsRef = useRef({
    uTime: { value: 0 },
    uIntensity: { value: intensity },
    uReduced: { value: reduced ? 1 : 0 },
  })

  uniformsRef.current.uIntensity.value = intensity
  uniformsRef.current.uReduced.value = reduced ? 1 : 0

  useFrame(({ clock }) => {
    if (!mesh.current) return
    uniformsRef.current.uTime.value = clock.getElapsedTime()
  })

  const shader = useMemo(() => ({
    uniforms: uniformsRef.current,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [])

  return (
    <mesh ref={mesh} scale={[2, 2, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial args={[shader]} />
    </mesh>
  )
}
