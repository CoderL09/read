import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function AmbientScene({ quiet = false }: { quiet?: boolean }) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !window.WebGLRenderingContext) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.z = 6

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    host.appendChild(renderer.domElement)

    const count = window.innerWidth < 640 ? 220 : 560
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const emerald = new THREE.Color('#62e6b7')
    const amber = new THREE.Color('#efb15f')
    const lavender = new THREE.Color('#a78bfa')

    for (let index = 0; index < count; index += 1) {
      const radius = 2.5 + Math.random() * 7
      const angle = Math.random() * Math.PI * 2
      positions[index * 3] = Math.cos(angle) * radius
      positions[index * 3 + 1] = (Math.random() - 0.5) * 8
      positions[index * 3 + 2] = -Math.random() * 7
      const color = index % 7 === 0 ? amber : index % 11 === 0 ? lavender : emerald
      colors.set([color.r, color.g, color.b], index * 3)
    }

    const dustGeometry = new THREE.BufferGeometry()
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    dustGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    const dustMaterial = new THREE.PointsMaterial({
      size: quiet ? 0.018 : 0.026,
      transparent: true,
      opacity: quiet ? 0.18 : 0.42,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const dust = new THREE.Points(dustGeometry, dustMaterial)
    scene.add(dust)

    const crystalGeometry = new THREE.IcosahedronGeometry(1.15, 1)
    const crystalMaterial = new THREE.MeshBasicMaterial({
      color: '#72e2bd',
      wireframe: true,
      transparent: true,
      opacity: quiet ? 0.018 : 0.075,
      blending: THREE.AdditiveBlending,
    })
    const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial)
    crystal.position.set(window.innerWidth < 800 ? 1.8 : 3.65, -0.35, -1.8)
    crystal.scale.set(1, 1.35, 1)
    scene.add(crystal)

    let targetX = 0
    let targetY = 0
    let frame = 0
    const clock = new THREE.Clock()

    const resize = () => {
      const width = host.clientWidth
      const height = host.clientHeight
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const pointer = (event: PointerEvent) => {
      targetX = event.clientX / window.innerWidth - 0.5
      targetY = event.clientY / window.innerHeight - 0.5
    }

    const render = () => {
      const elapsed = clock.getElapsedTime()
      if (!reducedMotion) {
        dust.rotation.y += (targetX * 0.13 - dust.rotation.y) * 0.018
        dust.rotation.x += (-targetY * 0.08 - dust.rotation.x) * 0.018
        dust.position.y = Math.sin(elapsed * 0.18) * 0.12
        crystal.rotation.x = elapsed * 0.045 - targetY * 0.22
        crystal.rotation.y = elapsed * 0.075 + targetX * 0.35
      }
      renderer.render(scene, camera)
      if (!reducedMotion) frame = window.requestAnimationFrame(render)
    }

    resize()
    render()
    window.addEventListener('resize', resize)
    if (!reducedMotion) window.addEventListener('pointermove', pointer, { passive: true })

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', pointer)
      dustGeometry.dispose()
      dustMaterial.dispose()
      crystalGeometry.dispose()
      crystalMaterial.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [quiet])

  return <div ref={hostRef} className="ambient-scene" aria-hidden="true" />
}
