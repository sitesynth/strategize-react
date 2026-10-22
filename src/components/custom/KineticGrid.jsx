// manual — port of the "Kinetic Grid" Framer code component (canvas grid that
// bends and lights up around the cursor). Click interaction and cursor trail
// are not ported: the template has both disabled.
import React, { useEffect, useRef } from 'react'

// Framer passes token colors as "var(--token-…, rgba(…))"; use the fallback value.
function parseColor(c) {
  if (!c || c === 'transparent') return { r: 0, g: 0, b: 0, a: 0 }
  const rgba = c.match(/rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)/i)
  if (rgba) return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: +rgba[4] }
  const rgb = c.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3], a: 1 }
  let hex = c.replace('#', '')
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  const n = i => parseInt(hex.substring(i, i + 2), 16)
  return { r: n(0) || 160, g: n(2) || 160, b: n(4) || 160, a: hex.length === 8 ? n(6) / 255 : 1 }
}

const mix = (from, to, t) => ({
  r: Math.round(from.r + (to.r - from.r) * t),
  g: Math.round(from.g + (to.g - from.g) * t),
  b: Math.round(from.b + (to.b - from.b) * t),
})

export default function KineticGrid({
  backgroundColor = 'transparent',
  gridColor = '#FFFFFF',
  dotColor = '#FFFFFF',
  hoverColor = '#FFFFFF',
  gridSize = 60,
  repulsionStrength = -0.65,
  radius = 290,
  dotSize = 1.5,
  gridThickness = 0.5,
  baseOpacity = 0.09,
  motionSpeed = 1,
  style,
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const bg = parseColor(backgroundColor)
    const line = parseColor(gridColor)
    const dot = parseColor(dotColor)
    const hover = parseColor(hoverColor)
    const speed = Math.max(0, Math.min(1, motionSpeed))
    const stiffness = 0.02 + speed * 0.06
    const damping = 0.7 + speed * 0.05
    const force = repulsionStrength <= 0 ? repulsionStrength * 25 : repulsionStrength * 90

    let width = 1, height = 1, frame = 0
    let mouse = null
    const points = new Map()

    const resize = () => {
      width = canvas.width = canvas.clientWidth || 1
      height = canvas.height = canvas.clientHeight || 1
      points.clear()
      for (let x = -gridSize; x < width + gridSize * 2; x += gridSize)
        for (let y = -gridSize; y < height + gridSize * 2; y += gridSize)
          points.set(`${x},${y}`, { ox: x, oy: y, x, y, vx: 0, vy: 0, size: 1 })
    }

    // 0..1 highlight falloff around the cursor
    const glow = (x, y) => {
      if (!mouse) return 0
      const d = Math.hypot(x - mouse.x, y - mouse.y)
      return d > radius ? 0 : (1 - d / radius) ** 3.5
    }
    const push = (x, y) => {
      if (!mouse || force === 0) return { x: 0, y: 0 }
      const dx = x - mouse.x, dy = y - mouse.y, d = Math.hypot(dx, dy)
      if (d === 0) return { x: 0, y: 0 }
      const f = (1 - Math.min(d / 400, 1)) ** 2 * force
      return { x: (dx / d) * f, y: (dy / d) * f }
    }

    const stroke = (a, b) => {
      const t = (glow(a.x, a.y) + glow(b.x, b.y)) / 2
      const c = mix(line, hover, t)
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.lineWidth = gridThickness + t * 2
      ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${baseOpacity + (1 - baseOpacity) * t})`
      ctx.stroke()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${bg.a})`
      ctx.fillRect(0, 0, width, height)

      points.forEach(p => {
        const right = points.get(`${p.ox + gridSize},${p.oy}`)
        const down = points.get(`${p.ox},${p.oy + gridSize}`)
        if (right) stroke(p, right)
        if (down) stroke(p, down)
      })

      points.forEach(p => {
        const off = push(p.ox, p.oy)
        p.vx = (p.vx + (p.ox + off.x - p.x) * stiffness) * damping
        p.vy = (p.vy + (p.oy + off.y - p.y) * stiffness) * damping
        p.x += p.vx
        p.y += p.vy
        const t = glow(p.x, p.y)
        p.size += (dotSize + t * dotSize - p.size) * 0.15
        const c = mix(dot, hover, t)
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(dotSize * 0.5, p.size), 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${baseOpacity + (1 - baseOpacity) * t})`
        ctx.fill()
      })

      frame = requestAnimationFrame(draw)
    }

    // The canvas has pointer-events:none, so track the cursor on window.
    const onMove = e => {
      const r = canvas.getBoundingClientRect()
      const x = (e.clientX - r.left) * (width / r.width)
      const y = (e.clientY - r.top) * (height / r.height)
      mouse = x >= 0 && y >= 0 && x <= width && y <= height ? { x, y } : null
    }

    resize()
    frame = requestAnimationFrame(draw)
    window.addEventListener('mousemove', onMove)
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      ro.disconnect()
    }
  }, [backgroundColor, gridColor, dotColor, hoverColor, gridSize, repulsionStrength, radius, dotSize, gridThickness, baseOpacity, motionSpeed])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  )
}
