// manual — replays a Framer shader component (animated WebGL2 gradient with an optional
// mouse "push" buffer pass). Shader sources + uniform values are read off the live site by
// migrator/extract-shaders.mjs into ./shaders/<container class>.json.
import React, { useEffect, useRef } from 'react'

const shaders = import.meta.glob('./shaders/*.json', { eager: true, import: 'default' })

const MAX_COLORS = 8
let probe

// "var(--token-x, rgb(…))" / any CSS color → [r, g, b, a] in 0..1
function parseColor(value) {
  probe ??= Object.assign(document.createElement('div'), { style: 'display:none' })
  probe.style.color = ''
  probe.style.color = value
  document.body.appendChild(probe)
  const m = getComputedStyle(probe).color.match(/[\d.]+/g) || [0, 0, 0]
  probe.remove()
  return [m[0] / 255, m[1] / 255, m[2] / 255, m[3] === undefined ? 1 : +m[3]]
}

function compile(gl, type, src) {
  const sh = gl.createShader(type)
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh))
  return sh
}

function program(gl, vs, fs) {
  const prog = gl.createProgram()
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vs))
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fs))
  gl.bindAttribLocation(prog, 0, 'a_position')
  gl.bindAttribLocation(prog, 1, 'a_texCoord')
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog))
  const locs = {}
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS)
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i)
    locs[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(prog, info.name)
  }
  return { prog, locs }
}

function makeTarget(gl, w, h) {
  const tex = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  return { tex, fbo, w, h }
}

export default function FramerShader({ shader, style }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const cfg = shaders[`./shaders/${shader}.json`]
    if (!canvas || !cfg) return
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: false })
    if (!gl) return
    gl.getExtension('EXT_color_buffer_float')
    gl.getExtension('OES_texture_float_linear')

    let main, passes = []
    try {
      main = program(gl, cfg.vertexShader, cfg.fragmentShader)
      passes = cfg.buffers.map(b => ({ ...program(gl, cfg.vertexShader, b.fragment), cfg: b, targets: null, read: 0 }))
    } catch (e) {
      console.error('FramerShader: compile failed', e)
      return
    }

    // Fullscreen quad
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)
    const vbo = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 0,   1, -1, 1, 0,   -1, 1, 0, 1,   1, 1, 1, 1,
    ]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8)

    // Static uniforms from the component props
    const colors = (cfg.uniforms.u_colors || []).map(parseColor)
    const flat = new Float32Array(MAX_COLORS * 4)
    colors.slice(0, MAX_COLORS).forEach((c, i) => flat.set(c, i * 4))
    const mouse = { x: -999, y: -999, vx: 0, vy: 0, hover: 0, down: 0, lastX: 0, lastY: 0, had: false }

    const setUniforms = (locs, time, dt, w, h, dpr) => {
      for (const [name, value] of Object.entries(cfg.uniforms)) {
        const loc = locs[name]
        if (loc == null || name === 'u_colors') continue
        gl.uniform1f(loc, typeof value === 'boolean' ? +value : +value)
      }
      if (locs.u_colors) gl.uniform4fv(locs.u_colors, flat)
      if (locs.u_colors_length) gl.uniform1i(locs.u_colors_length, Math.min(colors.length, MAX_COLORS))
      if (locs.u_time) gl.uniform1f(locs.u_time, time)
      if (locs.u_deltaTime) gl.uniform1f(locs.u_deltaTime, dt)
      if (locs.u_resolution) gl.uniform2f(locs.u_resolution, w, h)
      if (locs.u_pixelRatio) gl.uniform1f(locs.u_pixelRatio, dpr)
      if (locs.u_mousePosition) gl.uniform4f(locs.u_mousePosition, mouse.x, mouse.y, mouse.vx, mouse.vy)
      if (locs.u_mousePointerDown) gl.uniform1f(locs.u_mousePointerDown, mouse.down)
      if (locs.u_mouseHover) gl.uniform1f(locs.u_mouseHover, mouse.hover)
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
      // (passes are rebuilt per effect run, so also allocate when a re-run kept the canvas size)
      if (canvas.width === w && canvas.height === h && passes.every(p => p.targets)) return
      canvas.width = w
      canvas.height = h
      passes.forEach(p => {
        const s = p.cfg.resolutionScale ?? 1
        p.targets = [makeTarget(gl, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))),
                     makeTarget(gl, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s)))]
        p.read = 0
      })
    }

    const onMove = e => {
      const r = canvas.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width
      const y = 1 - (e.clientY - r.top) / r.height
      mouse.hover = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? 1 : 0
      mouse.x = x
      mouse.y = y
    }
    window.addEventListener('mousemove', onMove)

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0
    const t0 = performance.now()
    let last = t0
    const frame = now => {
      raf = requestAnimationFrame(frame)
      const r = canvas.getBoundingClientRect()
      if (r.bottom < 0 || r.top > window.innerHeight) { last = now; return }  // offscreen
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const time = (now - t0) / 1000

      // Per-frame pointer velocity in uv units
      mouse.vx = mouse.had && mouse.hover ? mouse.x - mouse.lastX : 0
      mouse.vy = mouse.had && mouse.hover ? mouse.y - mouse.lastY : 0
      mouse.lastX = mouse.x
      mouse.lastY = mouse.y
      mouse.had = mouse.hover === 1

      gl.bindVertexArray(vao)
      for (const p of passes) {
        const src = p.targets[p.read], dst = p.targets[1 - p.read]
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo)
        gl.viewport(0, 0, dst.w, dst.h)
        gl.useProgram(p.prog)
        setUniforms(p.locs, time, dt, dst.w, dst.h, dpr)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, src.tex)
        gl.uniform1i(p.locs[p.cfg.uniformName], 0)
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        p.read = 1 - p.read
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.useProgram(main.prog)
      setUniforms(main.locs, time, dt, canvas.width, canvas.height, dpr)
      passes.forEach(p => {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, p.targets[p.read].tex)
        gl.uniform1i(main.locs[p.cfg.uniformName], 0)
      })
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      ro.disconnect()
      // Free GPU objects but keep the context: React StrictMode re-runs this effect on the
      // same canvas, and a lost context can't be recreated there.
      gl.deleteProgram(main.prog)
      passes.forEach(p => {
        gl.deleteProgram(p.prog)
        p.targets?.forEach(t => { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fbo) })
      })
      gl.deleteBuffer(vbo)
      gl.deleteVertexArray(vao)
    }
  }, [shader])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }}
    />
  )
}
