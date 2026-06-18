import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import GLOBE from 'vanta/dist/vanta.globe.min'

/**
 * Animated globe backdrop for the login screen, built on Vanta.js + three.js.
 *
 * Colors are pulled from the app's own palette (navy ink, azure blue, brass
 * gold) rather than Vanta's stock pink-on-purple preset, so the one
 * "marketing moment" in the app still reads as the same product, not a
 * stock effect bolted on. A globe also isn't arbitrary here: it's a literal
 * nod to "multiple workspaces, one connected team" - and the navy/brass
 * combination leans into a nautical-chart feel that a blue brand color pairs
 * naturally with.
 *
 * Respects prefers-reduced-motion by simply not mounting the effect - the
 * login card still renders against the plain ink background in that case.
 */
export default function VantaBackground({ className }) {
  const hostRef = useRef(null)
  const effectRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !hostRef.current) return

    effectRef.current = GLOBE({
      el: hostRef.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.0,
      minWidth: 200.0,
      scale: 1.0,
      scaleMobile: 1.0,
      backgroundColor: 0x0a1322,
      color: 0xc9a66b,
      color2: 0x3d77a8,
      size: 1.05
    })

    return () => {
      effectRef.current?.destroy()
      effectRef.current = null
    }
  }, [])

  return <div ref={hostRef} className={className} aria-hidden="true" />
}
