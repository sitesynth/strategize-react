// manual — port of the Framer "reveal text" code component used for the oversized footer
// wordmark: while the pointer is over the text, a circle (radius = 20% of the box width) grows
// around the cursor and reveals a Kinetic Grid inside the glyphs.
// Framer does this with an SVG <mask> over a <foreignObject>, which WebKit/Safari ignores (the
// grid then shows as an unmasked rectangle). So the grid is drawn here on a canvas and masked
// with canvas compositing instead — the same on every browser. The SSR text stays as it is.
import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import KineticGrid from './KineticGrid.jsx'

function enhance(svg, cfg) {
  const label = svg.querySelector(':scope > text:last-of-type')
  const box = svg.parentElement
  if (!label || !box || !svg.querySelector('mask[id="revealMask"]') || svg.__reveal) return null
  svg.__reveal = true

  // Grid source: an invisible but laid-out KineticGrid (it needs real size + the pointer).
  const host = document.createElement('div')
  host.style.cssText = 'position:absolute;left:0;top:50%;width:100%;height:' + (cfg.gridHeight || 744) +
    'px;margin-top:-' + (cfg.gridHeight || 744) / 2 + 'px;opacity:0;pointer-events:none'
  box.appendChild(host)
  const root = createRoot(host)
  root.render(<KineticGrid {...cfg.grid} />)

  const out = document.createElement('canvas')
  out.setAttribute('aria-hidden', 'true')
  out.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;opacity:' + (cfg.gridOpacity ?? 1)
  box.appendChild(out)
  const ctx = out.getContext('2d')

  const state = { cx: 0, cy: 0, r: 0, from: 0, to: 0, t0: 0, dur: 1, cleared: false }
  const full = () => (Number((svg.getAttribute('viewBox') || '').split(/\s+/)[2]) || 0) * (cfg.radius ?? 20) / 100
  const radiusAt = now => {
    const k = Math.min(1, (now - state.t0) / (state.dur * 1000))
    return state.from + (state.to - state.from) * k
  }
  const setTarget = (to, dur) => {
    const now = performance.now()
    state.from = radiusAt(now)
    state.to = to
    state.t0 = now
    state.dur = dur
  }

  // viewBox units → pointer position (the svg is xMidYMid meet inside the box)
  const geometry = () => {
    const rect = svg.getBoundingClientRect()
    const [, , vw, vh] = (svg.getAttribute('viewBox') || '0 0 0 0').split(/\s+/).map(Number)
    if (!vw || !vh || !rect.width) return null
    const s = Math.min(rect.width / vw, rect.height / vh)
    return { rect, vw, vh, s, tx: (rect.width - vw * s) / 2, ty: (rect.height - vh * s) / 2 }
  }
  const place = e => {
    const g = geometry()
    if (!g) return
    state.cx = (e.clientX - g.rect.left - g.tx) / g.s
    state.cy = (e.clientY - g.rect.top - g.ty) / g.s
  }
  const enter = e => { place(e); setTarget(full(), cfg.hoverIn ?? 0.8) }
  const leave = () => setTarget(0, cfg.hoverOut ?? 0.7)
  box.addEventListener('mouseenter', enter)
  box.addEventListener('mousemove', place)
  box.addEventListener('mouseleave', leave)

  let raf = 0
  const frame = () => {
    raf = requestAnimationFrame(frame)
    if (!svg.getClientRects().length) return
    const r = radiusAt(performance.now())
    const grid = host.querySelector('canvas')
    const g = geometry()
    if (!g || !grid) return
    if (r < 0.5) {
      if (!state.cleared) { ctx.clearRect(0, 0, out.width, out.height); state.cleared = true }
      return
    }
    state.cleared = false
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const bw = Math.round(g.rect.width * dpr), bh = Math.round(g.rect.height * dpr)
    if (out.width !== bw || out.height !== bh) { out.width = bw; out.height = bh }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, bw, bh)
    // the grid canvas is centered on the box and taller than it
    const gh = host.getBoundingClientRect().height
    ctx.drawImage(grid, 0, 0, grid.width, grid.height, 0, (g.rect.height - gh) / 2 * dpr, g.rect.width * dpr, gh * dpr)

    // keep only the reveal circle ∩ the glyphs (drawn in viewBox units)
    ctx.setTransform(dpr * g.s, 0, 0, dpr * g.s, dpr * g.tx, dpr * g.ty)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(state.cx, state.cy, r, 0, Math.PI * 2)
    ctx.fill()

    const cs = getComputedStyle(label)
    const fs = parseFloat(cs.fontSize)
    const ls = parseFloat(cs.letterSpacing) || 0
    const text = label.textContent
    ctx.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    const xh = ctx.measureText('x').actualBoundingBoxAscent || fs * 0.5
    const total = ctx.measureText(text).width + text.length * ls
    const x0 = Number(label.getAttribute('x')) - total / 2
    const y0 = Number(label.getAttribute('y')) + xh / 2
    // dominant-baseline:middle + letter-spacing, glyph by glyph (prefix widths keep the kerning)
    // Intersect with the text: draw it on a scratch layer, then keep the overlap.
    scratch.width = bw
    scratch.height = bh
    sctx.setTransform(dpr * g.s, 0, 0, dpr * g.s, dpr * g.tx, dpr * g.ty)
    sctx.font = ctx.font
    sctx.textAlign = 'left'
    sctx.textBaseline = 'alphabetic'
    sctx.fillStyle = '#fff'
    for (let i = 0; i < text.length; i++) {
      sctx.fillText(text[i], x0 + ctx.measureText(text.slice(0, i)).width + i * ls, y0)
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(scratch, 0, 0)
    ctx.globalCompositeOperation = 'source-over'
  }
  const scratch = document.createElement('canvas')
  const sctx = scratch.getContext('2d')
  raf = requestAnimationFrame(frame)

  return () => {
    cancelAnimationFrame(raf)
    box.removeEventListener('mouseenter', enter)
    box.removeEventListener('mousemove', place)
    box.removeEventListener('mouseleave', leave)
    setTimeout(() => root.unmount(), 0)  // not during React's commit phase
    host.remove()
    out.remove()
    svg.__reveal = false
  }
}

export default function useRevealText(cfg) {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!cfg) return
    const cleanups = [...document.querySelectorAll('svg')].map(svg => enhance(svg, cfg)).filter(Boolean)
    return () => cleanups.forEach(fn => fn())
  }, [pathname])
}
