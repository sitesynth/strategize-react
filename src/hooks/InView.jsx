import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function useInViewIgnoringTransform(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const check = () => {
      const r = el.getBoundingClientRect()
      const dy = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42
      if (r.width > 0 && r.top - dy < window.innerHeight && r.bottom - dy > 0) setSeen(true)
    }
    check()
    // The element may have no size at mount (stylesheet / breakpoint variant not
    // applied yet) — re-check once it lays out, not only on scroll.
    const ro = new ResizeObserver(check)
    ro.observe(el)
    window.addEventListener('scroll', check, { passive: true })
    window.addEventListener('resize', check)
    return () => {
      ro.disconnect()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
    }
  }, [seen])
  return seen
}

const cache = {}
export const InView = new Proxy({}, {
  get(_, tag) {
    return cache[tag] ??= function InViewMotion({ whileInView, viewport, ...props }) {
      const ref = useRef(null)
      const seen = useInViewIgnoringTransform(ref)
      const M = motion[tag]
      return <M ref={ref} {...props} animate={seen ? whileInView : props.animate} />
    }
  },
})
