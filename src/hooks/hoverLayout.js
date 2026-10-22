// Hover runtime for Framer gesture components.
// diffs (optional): [{ k, props }] measured on the live site — inline-style props that
// change on hover, per node of the element's subtree (k = class-based node key; '' = the element).
function nodeKeys(root) {
  const counts = {}
  return [root, ...root.querySelectorAll('*')].map((n, i) => {
    if (i === 0) return ['', n]
    const base = [...n.classList].filter(c => c.startsWith('framer-') && !c.startsWith('framer-v-')).sort().join(' ')
    return [`${base}#${counts[base] = (counts[base] ?? -1) + 1}`, n]
  })
}

function applyDiffs(root, on, diffs) {
  const keyed = new Map(nodeKeys(root))
  const nodes = [...keyed.values()]
  const saved = (root.__hoverSaved ??= new Map())
  for (const { k, i, props } of diffs) {
    const n = k !== undefined ? keyed.get(k) : nodes[i]  // i: older index-based snapshots
    if (!n) continue
    for (const [p, v] of Object.entries(props)) {
      if (on) {
        const s = saved.get(n) ?? {}
        if (!(p in s)) s[p] = n.style.getPropertyValue(p)
        saved.set(n, s)
        if (v == null) n.style.removeProperty(p)
        else n.style.setProperty(p, v)
      } else {
        const s = saved.get(n)
        if (!s || !(p in s)) continue
        if (s[p]) n.style.setProperty(p, s[p])
        else n.style.removeProperty(p)
        delete s[p]
      }
    }
  }
}

// Toggles the "hover" class (+ measured style changes) and animates the resulting layout
// change. Framer hover variants often swap positions (e.g. a button label slides out
// while its duplicate slides in); CSS can't transition top/bottom/position swaps, so
// FLIP them with the Web Animations API.
export function hoverLayout(root, on, diffs) {
  const els = [...root.querySelectorAll('[class*="framer-"]')]
  const before = els.map(el => el.getBoundingClientRect())
  els.forEach(el => el.getAnimations().forEach(a => a.cancel()))
  root.classList.toggle('hover', on)
  if (diffs) applyDiffs(root, on, diffs)
  const moved = []
  els.forEach((el, i) => {
    if (moved.some(m => m.contains(el))) return  // ancestor already carries the motion
    const a = before[i], b = el.getBoundingClientRect()
    const dx = a.left - b.left, dy = a.top - b.top
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return
    moved.push(el)
    const base = getComputedStyle(el).transform
    const rest = base === 'none' ? '' : ' ' + base
    el.animate(
      [{ transform: `translate(${dx}px, ${dy}px)${rest}` }, { transform: base }],
      { duration: 400, easing: 'cubic-bezier(0.44, 0, 0.56, 1)' },
    )
  })
}
