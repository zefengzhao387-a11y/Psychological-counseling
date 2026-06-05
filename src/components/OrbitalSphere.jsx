import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './OrbitalSphere.css'

const ORBIT_COLORS = [0x6ee7ff, 0xf472b6]
const ORBIT_COUNT = 8
const TRAIL_LEN = 14
const RING_UP = new THREE.Vector3(0, 1, 0)

/** Fibonacci 球面均匀分布，轨道法线覆盖上下左右与斜向 */
function buildOrbitLayouts(count) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const layouts = []

  for (let i = 0; i < count; i += 1) {
    const y = count === 1 ? 0 : 1 - (2 * i) / (count - 1)
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = goldenAngle * i

    layouts.push({
      radius: 0.53,
      normal: new THREE.Vector3(
        Math.cos(theta) * radiusAtY,
        y,
        Math.sin(theta) * radiusAtY,
      ),
      speed: 0.36 + (i % 5) * 0.025,
      phase: (i / count) * Math.PI * 2,
    })
  }

  return layouts
}

const ORBIT_LAYOUT = buildOrbitLayouts(ORBIT_COUNT)

function createOrbitRing(radius, normal, color, opacity) {
  const segments = 96
  const points = []
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2
    points.push(new THREE.Vector3(Math.cos(t) * radius, 0, Math.sin(t) * radius))
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const ring = new THREE.Line(geometry, material)

  const n = normal.clone().normalize()
  if (Math.abs(n.dot(RING_UP)) > 0.999) {
    ring.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), n.y < 0 ? Math.PI : 0)
  } else {
    ring.quaternion.setFromUnitVectors(RING_UP, n)
  }

  return { ring, material }
}

export default function OrbitalSphere({ onReady, onClick }) {
  const hostRef = useRef(null)
  const rotationRef = useRef({ x: 0.28, y: 0 })
  const pointerRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  })
  const hoverRef = useRef({ active: false, nx: 0, ny: 0 })
  const energyRef = useRef(0)
  const clickPulseRef = useRef(0)
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  const DRAG_THRESHOLD = 8

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const width = host.clientWidth
    const height = host.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50)
    camera.position.set(0, 0, 3.15)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    const root = new THREE.Group()
    root.scale.setScalar(0.88)
    scene.add(root)

    const coreGroup = new THREE.Group()
    root.add(coreGroup)

    const coreGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0x6ee7ff,
        transparent: true,
        opacity: 0.22,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    )
    coreGroup.add(coreGlow, core)

    const orbits = ORBIT_LAYOUT.map((layout, i) => {
      const color = ORBIT_COLORS[i % ORBIT_COLORS.length]
      const { ring, material: ringMaterial } = createOrbitRing(
        layout.radius,
        layout.normal,
        color,
        0.52,
      )
      root.add(ring)

      const trailPositions = new Float32Array(TRAIL_LEN * 3)
      const trailGeo = new THREE.BufferGeometry()
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))

      const trailMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.58,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const trail = new THREE.Line(trailGeo, trailMaterial)
      ring.add(trail)

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.018, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      const headGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.032, 8, 8),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.22,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      ring.add(head, headGlow)

      return {
        ...layout,
        head,
        headGlow,
        ringMaterial,
        trailMaterial,
        trailPositions,
        trailGeo,
        history: Array.from({ length: TRAIL_LEN }, () => new THREE.Vector3()),
        cursor: 0,
      }
    })

    const canvas = renderer.domElement

    const updatePointerHover = (event) => {
      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      hoverRef.current.nx = ((event.clientX - rect.left) / rect.width) * 2 - 1
      hoverRef.current.ny = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    }

    const onPointerDown = (event) => {
      pointerRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      }
      updatePointerHover(event)
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event) => {
      updatePointerHover(event)

      const pointer = pointerRef.current
      if (!pointer.active) return

      const dx = event.clientX - pointer.lastX
      const dy = event.clientY - pointer.lastY
      const totalX = event.clientX - pointer.startX
      const totalY = event.clientY - pointer.startY

      if (Math.hypot(totalX, totalY) > DRAG_THRESHOLD) {
        pointer.moved = true
      }

      if (pointer.moved) {
        rotationRef.current.y += dx * 0.006
        rotationRef.current.x += dy * 0.006
        rotationRef.current.x = Math.max(-1.0, Math.min(1.0, rotationRef.current.x))
      }

      pointer.lastX = event.clientX
      pointer.lastY = event.clientY
    }

    const onPointerUp = (event) => {
      const pointer = pointerRef.current
      if (pointer.active && !pointer.moved) {
        clickPulseRef.current = 1
        onClickRef.current?.()
      }
      pointer.active = false
      canvas.releasePointerCapture(event.pointerId)
    }

    const onPointerEnter = () => {
      hoverRef.current.active = true
      host.classList.add('orbital-sphere--hover')
    }

    const onPointerLeave = () => {
      hoverRef.current.active = false
      hoverRef.current.nx = 0
      hoverRef.current.ny = 0
      host.classList.remove('orbital-sphere--hover')
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)
    canvas.addEventListener('pointerenter', onPointerEnter)
    canvas.addEventListener('pointerleave', onPointerLeave)

    const resize = () => {
      const w = host.clientWidth
      const h = host.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', resize)

    let frameId = 0
    const tick = (time) => {
      const t = time * 0.001

      const targetEnergy = hoverRef.current.active ? 1 : 0
      energyRef.current += (targetEnergy - energyRef.current) * 0.09
      clickPulseRef.current *= 0.9

      const energy = energyRef.current
      const pulse = clickPulseRef.current
      const speedMul = 1 + energy * 0.35 + pulse * 1.4

      const parallaxX = hoverRef.current.nx * energy * 0.14
      const parallaxY = hoverRef.current.ny * energy * 0.12

      root.rotation.x = rotationRef.current.x + Math.sin(t * 0.15) * 0.02 + parallaxY
      root.rotation.y = rotationRef.current.y + t * (0.07 + energy * 0.04) + parallaxX

      const coreScale = 1 + Math.sin(t * 1.8) * 0.025 + energy * 0.05 + pulse * 0.18
      coreGroup.scale.setScalar(coreScale)
      core.material.opacity = 0.85 + energy * 0.08 + pulse * 0.1
      coreGlow.material.opacity = 0.18 + energy * 0.14 + pulse * 0.22

      camera.position.z = 3.15 - energy * 0.08 - pulse * 0.05

      orbits.forEach((orbit, i) => {
        const angle = t * orbit.speed * speedMul + orbit.phase
        const x = Math.cos(angle) * orbit.radius
        const z = Math.sin(angle) * orbit.radius
        const y = Math.sin(angle * 2) * 0.03

        orbit.head.position.set(x, y, z)
        orbit.headGlow.position.set(x, y, z)

        const headScale = 1 + energy * 0.25 + pulse * 0.35
        orbit.head.scale.setScalar(headScale)
        orbit.headGlow.scale.setScalar(headScale * 1.3)
        orbit.headGlow.material.opacity = 0.16 + energy * 0.14 + pulse * 0.22

        orbit.ringMaterial.opacity = 0.46 + (i % 2) * 0.04 + energy * 0.1 + pulse * 0.08
        orbit.trailMaterial.opacity = 0.48 + energy * 0.2 + pulse * 0.22

        orbit.history[orbit.cursor].set(x, y, z)
        orbit.cursor = (orbit.cursor + 1) % TRAIL_LEN

        for (let j = 0; j < TRAIL_LEN; j += 1) {
          const idx = (orbit.cursor - 1 - j + TRAIL_LEN) % TRAIL_LEN
          const p = orbit.history[idx]
          orbit.trailPositions[j * 3] = p.x
          orbit.trailPositions[j * 3 + 1] = p.y
          orbit.trailPositions[j * 3 + 2] = p.z
        }
        orbit.trailGeo.attributes.position.needsUpdate = true
        orbit.trailGeo.setDrawRange(0, TRAIL_LEN)
      })

      renderer.render(scene, camera)
      frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    onReady?.()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointercancel', onPointerUp)
      canvas.removeEventListener('pointerenter', onPointerEnter)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [onReady])

  return <div ref={hostRef} className="orbital-sphere" aria-hidden />
}
