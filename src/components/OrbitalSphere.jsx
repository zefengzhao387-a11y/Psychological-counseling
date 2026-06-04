import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import './OrbitalSphere.css'

const ORBIT_COLORS = [0xff5ec8, 0x7ee8ff, 0xb794ff, 0xff8fab, 0x6ee7ff, 0xd946ef]

function createOrbitRing(radius, tilt, color, opacity) {
  const segments = 160
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
  ring.rotation.set(tilt.x, tilt.y, tilt.z)
  return ring
}

export default function OrbitalSphere({ onReady, onClick }) {
  const hostRef = useRef(null)
  const rotationRef = useRef({ x: 0.35, y: 0 })
  const pointerRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
  })
  const onClickRef = useRef(onClick)
  onClickRef.current = onClick

  const DRAG_THRESHOLD = 8

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const width = host.clientWidth
    const height = host.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50)
    camera.position.set(0, 0, 3.6)

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    host.appendChild(renderer.domElement)

    const root = new THREE.Group()
    scene.add(root)

    const orbits = []
    const orbitCount = 20

    for (let i = 0; i < orbitCount; i += 1) {
      const radius = 0.78 + (i % 5) * 0.04
      const color = ORBIT_COLORS[i % ORBIT_COLORS.length]
      const tilt = {
        x: (i / orbitCount) * Math.PI + 0.4,
        y: (i * 1.7) % (Math.PI * 2),
        z: (i * 0.55) % Math.PI,
      }

      const ring = createOrbitRing(radius, tilt, color, 0.22 + (i % 3) * 0.08)
      root.add(ring)

      const trailLen = 28
      const trailPositions = new Float32Array(trailLen * 3)
      const trailGeo = new THREE.BufferGeometry()
      trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3))

      const trail = new THREE.Line(
        trailGeo,
        new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.75,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      ring.add(trail)

      const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.028, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      ring.add(head)

      const glow = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 10, 10),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.35,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      ring.add(glow)

      orbits.push({
        radius,
        speed: 0.55 + (i % 7) * 0.12,
        phase: (i / orbitCount) * Math.PI * 2,
        trailPositions,
        trailGeo,
        trailLen,
        head,
        glow,
        history: Array.from({ length: trailLen }, () => new THREE.Vector3()),
        cursor: 0,
      })
    }

    const canvas = renderer.domElement

    const onPointerDown = (event) => {
      pointerRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        moved: false,
      }
      canvas.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event) => {
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
        rotationRef.current.x = Math.max(-1.2, Math.min(1.2, rotationRef.current.x))
      }

      pointer.lastX = event.clientX
      pointer.lastY = event.clientY
    }

    const onPointerUp = (event) => {
      const pointer = pointerRef.current
      if (pointer.active && !pointer.moved) {
        onClickRef.current?.()
      }
      pointer.active = false
      canvas.releasePointerCapture(event.pointerId)
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('pointercancel', onPointerUp)

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
      root.rotation.x = rotationRef.current.x + Math.sin(t * 0.2) * 0.04
      root.rotation.y = rotationRef.current.y + t * 0.12

      orbits.forEach((orbit) => {
        const angle = t * orbit.speed + orbit.phase
        const x = Math.cos(angle) * orbit.radius
        const z = Math.sin(angle) * orbit.radius
        const y = Math.sin(angle * 2) * 0.06

        orbit.head.position.set(x, y, z)
        orbit.glow.position.set(x, y, z)

        orbit.history[orbit.cursor] = new THREE.Vector3(x, y, z)
        orbit.cursor = (orbit.cursor + 1) % orbit.trailLen

        for (let i = 0; i < orbit.trailLen; i += 1) {
          const idx = (orbit.cursor - 1 - i + orbit.trailLen) % orbit.trailLen
          const p = orbit.history[idx]
          orbit.trailPositions[i * 3] = p.x
          orbit.trailPositions[i * 3 + 1] = p.y
          orbit.trailPositions[i * 3 + 2] = p.z
        }
        orbit.trailGeo.attributes.position.needsUpdate = true
        orbit.trailGeo.setDrawRange(0, orbit.trailLen)
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
      renderer.dispose()
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [onReady])

  return <div ref={hostRef} className="orbital-sphere" aria-hidden />
}
