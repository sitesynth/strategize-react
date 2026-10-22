import React, { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import useRevealText from './components/custom/useRevealText.jsx'

import HomePage from './pages/HomePage.jsx'
import _404Page from './pages/_404Page.jsx'
import BlogsHowToCreateALeadMagnetThatActuallyConvertsPage from './pages/BlogsHowToCreateALeadMagnetThatActuallyConvertsPage.jsx'
import BlogsHowToTurnSocialMediaAttentionIntoRealRevenuePage from './pages/BlogsHowToTurnSocialMediaAttentionIntoRealRevenuePage.jsx'
import BlogsMetricsThatActuallyMatterIn2025Page from './pages/BlogsMetricsThatActuallyMatterIn2025Page.jsx'
import BlogsRepurposeLikeAProTurn1PostInto10Page from './pages/BlogsRepurposeLikeAProTurn1PostInto10Page.jsx'
import BlogsTheRealReasonYourWebsiteIsnE28099tConvertingVisitorsPage from './pages/BlogsTheRealReasonYourWebsiteIsnE28099tConvertingVisitorsPage.jsx'
import BlogsWhyDataDrivenMarketingOutperformsGuessworkEveryTimePage from './pages/BlogsWhyDataDrivenMarketingOutperformsGuessworkEveryTimePage.jsx'
import BlogsWhyMostMarketingCampaignsFailBeforeTheyEverLaunchPage from './pages/BlogsWhyMostMarketingCampaignsFailBeforeTheyEverLaunchPage.jsx'
import BlogsWhyYourBrandVoiceMattersMoreThanEverPage from './pages/BlogsWhyYourBrandVoiceMattersMoreThanEverPage.jsx'
import BlogsPage from './pages/BlogsPage.jsx'
import CaseStudyBuildingAScalableContentEngineForElevateLabsPage from './pages/CaseStudyBuildingAScalableContentEngineForElevateLabsPage.jsx'
import CaseStudyDoublingLocalLeadsForUrbanfixWithoutIncreasingAdSpendPage from './pages/CaseStudyDoublingLocalLeadsForUrbanfixWithoutIncreasingAdSpendPage.jsx'
import CaseStudyFromLowQualityLeadsToEnterpriseDemosPage from './pages/CaseStudyFromLowQualityLeadsToEnterpriseDemosPage.jsx'
import CaseStudyHowCreativeTestingIncreasedAuroraRevenuePage from './pages/CaseStudyHowCreativeTestingIncreasedAuroraRevenuePage.jsx'
import CaseStudyHowWeScaledAFitnessBrandIn90DaysPage from './pages/CaseStudyHowWeScaledAFitnessBrandIn90DaysPage.jsx'
import CaseStudyRepositioningNexaConsultingToIncreaseConversionsBy61Page from './pages/CaseStudyRepositioningNexaConsultingToIncreaseConversionsBy61Page.jsx'
import CaseStudyPage from './pages/CaseStudyPage.jsx'
import ContactPage from './pages/ContactPage.jsx'
import LegalPrivacyPage from './pages/LegalPrivacyPage.jsx'
import LegalTermsOfServicePage from './pages/LegalTermsOfServicePage.jsx'

// Scroll-appear: add .appeared when elements scroll into view.
// Uses scroll listener + getBoundingClientRect instead of IntersectionObserver
// because Framer's overflow:clip on ancestor containers blocks IO callbacks.
// Stagger: elements that enter the viewport in the same scroll-tick are sorted
// top-to-bottom and revealed with 60ms between each, matching Framer's stagger.
function useScrollAppear() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Parse appear config from data-framer-appear-id value: "t<threshold>-a<animateOnce>"
    // e.g. "t0.5-a1" → threshold=0.5, animateOnce=true. Falls back to defaults.
    function parseAppearCfg(el) {
      const v = el.dataset.framerAppearId || ''
      const t = parseFloat(v.match(/t([0-9.]+)/)?.[1] ?? '0.9')
      const a = !v.includes('-a0')
      return { threshold: isNaN(t) ? 0.9 : t, animateOnce: a }
    }
    const pending = new Set(document.querySelectorAll('[data-framer-appear-id]'))
    if (!pending.size) return
    function check() {
      const vh = window.innerHeight
      const toReveal = []
      for (const el of pending) {
        const { threshold, animateOnce } = parseAppearCfg(el)
        const top = el.getBoundingClientRect().top
        const height = el.offsetHeight
        // threshold is IO-style: fraction of element that must be visible.
        // visible px = min(top+height, vh) - max(top, 0); trigger when visible >= threshold*height.
        // Simplified: top <= vh - threshold*height (covers partial-below case).
        if (height > 0 && top <= vh - threshold * height && top > -height) {
          toReveal.push({ el, top })
          if (animateOnce) pending.delete(el)
        }
      }
      if (toReveal.length) {
        toReveal.sort((a, b) => a.top - b.top)
        // Pause transition, add class, force reflow, re-enable transition.
        // Without force reflow, will-change:opacity compositor layers get stuck at opacity:0.
        toReveal.forEach(({ el }, i) => {
          const delay = Math.min(i * 0.06, 0.5)
          el.style.transition = 'none'
          el.classList.add('appeared')
          void el.offsetHeight  // force reflow
          el.style.transition = ''
          el.style.transitionDelay = delay + 's'
          // Framer's CSS keeps will-change: opacity, transform, filter on every appear
          // element permanently, promoting it to its own compositor layer forever. Once the
          // reveal transition is done there's no more animation to accelerate, and the stale
          // layer can end up painted blank after a tab is backgrounded and refocused (a real
          // Chromium compositing quirk, not specific to this build) — dropping the hint once
          // the transition settles avoids leaving that layer around to go stale. The timeout
          // is a fallback for the (rare) case nothing actually transitions and the event never
          // fires — 1s safely clears any transition/delay combo this hook ever sets.
          const clearWillChange = () => { el.style.transitionDelay = ''; el.style.willChange = 'auto' }
          el.addEventListener('transitionend', clearWillChange, { once: true })
          setTimeout(clearWillChange, 1000)
        })
      }
      if (!pending.size) window.removeEventListener('scroll', check)
    }
    // Defer the initial check so the browser has finished layout (fonts, images)
    // before we measure offsetHeight/getBoundingClientRect.
    const raf = requestAnimationFrame(() => requestAnimationFrame(check))
    // Second check after 300ms: catches elements that had h=0 during the initial RAF
    // (e.g. deferred fonts/images shifting layout) but are now in viewport.
    const tid2 = setTimeout(check, 300)
    window.addEventListener('scroll', check, { passive: true })
    // Re-check on resize: SSR breakpoint variants become visible after viewport changes
    // (display:none → display:block/contents) but were not in view when hook first ran.
    window.addEventListener('resize', check, { passive: true })
    return () => { cancelAnimationFrame(raf); clearTimeout(tid2); window.removeEventListener('scroll', check); window.removeEventListener('resize', check) }
  }, [pathname])
}

// M10: Animate Framer "scrolling image" code components.
// Horizontal loop: the image strip (3 copies in a row) translates left at speed px/s,
// resetting when it crosses one image width so the scroll is seamless.
// Scroll scale: outer [role="img"] wrapper scale interpolates from startScale→1 as the
// section scrolls out of viewport (matches Framer's scrollScale:true behavior).
function useScrollBg() {
  const { pathname } = useLocation()
  useEffect(() => {
    const containers = [...document.querySelectorAll('[data-scroll-bg]')]
    if (!containers.length) return
    const cleanups = containers.map(container => {
      // Framer's chunk CSS gives scroll-bg containers z-index:1. Move to first child so
      // sibling content (later in DOM) paints on top at the same stacking level.
      container.parentElement?.prepend(container)
      container.style.zIndex = '0'
      const section = container.parentElement
      if (section) {
        // Sibling containers within this section may use overflow:clip which cuts off
        // absolutely-positioned content (e.g. CTA buttons) that extends beyond them.
        // Override to visible so the buttons are not clipped.
        ;[...section.children].forEach(child => {
          if (child !== container && getComputedStyle(child).overflow === 'clip') {
            child.style.overflow = 'visible'
          }
        })
        // Elements in the scroll-bg hero section start at opacity:0 from Framer's appear system
        // ([data-framer-appear-id]:not(.appeared) { opacity:0 !important }). They are always in
        // the initial viewport so they should be immediately visible. Adding .appeared triggers
        // the transition, but the CSS transition on [data-framer-appear-id] gets "stuck" at the
        // initial state when the element is on a compositor layer (will-change:opacity).
        // Fix: disable transition → add .appeared → force reflow → re-enable transition.
        const toAppear = [...section.querySelectorAll('[data-framer-appear-id]')].filter(el => {
          if (container.contains(el)) return false
          const ssrP = el.closest('.ssr-variant')
          return !ssrP || getComputedStyle(ssrP).display !== 'none'
        })
        toAppear.forEach(el => { el.style.transition = 'none' })
        toAppear.forEach(el => { el.classList.add('appeared') })
        section.offsetHeight  // force single reflow so class change applies before transition re-enables
        toAppear.forEach(el => { el.style.transition = '' })
        // Drop the permanent will-change hint once revealed — see useScrollAppear for why
        // a stale compositor layer left on these can end up painted blank later.
        toAppear.forEach(el => {
          const clear = () => { el.style.willChange = 'auto' }
          el.addEventListener('transitionend', clear, { once: true })
          setTimeout(clear, 1000)
        })
      }
      const [speedStr, direction = 'left'] = (container.getAttribute('data-scroll-bg') || '30|left').split('|')
      const speed = parseInt(speedStr, 10) || 30
      const imgWrapper = container.querySelector('[role="img"]')
      const strip = container.querySelector('[aria-hidden="true"]')
      if (!imgWrapper || !strip) return null
      // Read startScale from the element's inline transform (set by Framer SSR)
      const tfm = imgWrapper.style.transform || ''
      const startScale = parseFloat(tfm.match(/scale(([^)]+))/)?.[1] ?? '1.18')
      const endScale = 1
      const firstImg = strip.firstElementChild
      // Horizontal loop
      let offset = 0
      let last = performance.now()
      let rafId
      function loop(now) {
        const dt = (now - last) / 1000
        last = now
        const imgW = firstImg?.naturalWidth || firstImg?.offsetWidth || 2880
        offset += speed * dt * (direction === 'right' ? -1 : 1)
        if (offset >= imgW) offset -= imgW
        if (offset < 0) offset += imgW
        strip.style.transform = 'translateX(-' + offset + 'px)'
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
      // Scroll scale
      function onScroll() {
        const rect = container.getBoundingClientRect()
        const progress = Math.max(0, Math.min(1, -rect.top / (rect.height || 1)))
        const scale = startScale + (endScale - startScale) * progress
        imgWrapper.style.transform = 'scale(' + scale + ')'
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
      return () => { cancelAnimationFrame(rafId); window.removeEventListener('scroll', onScroll) }
    })
    return () => cleanups.forEach(c => c?.())
  }, [pathname])
}

// M11: Animate Framer variant state machine (hub/cycle) components.
// Each step shows a different layout variant (CSS class). Delays are stored in
// data-hub-cycle="cssClass:delayMs|..." where delay is ms to wait BEFORE entering the step.
// Plays through the steps once on mount and stops at the last one — this mirrors the
// original Framer variant-state-machine, which is a one-shot entrance sequence, not a
// looping carousel (confirmed against the exported chunk: 8 steps, no loop-back).
function useHubCycle() {
  const { pathname } = useLocation()
  useEffect(() => {
    const hubs = [...document.querySelectorAll('[data-hub-cycle]')]
    if (!hubs.length) return
    const cleanups = hubs.map(hub => {
      const steps = (hub.getAttribute('data-hub-cycle') || '').split('|').map(s => {
        const [cls, delay] = s.split(':')
        return { cls, delay: parseInt(delay, 10) || 0 }
      }).filter(s => s.cls)
      if (steps.length < 2) return null
      const varClasses = steps.map(s => s.cls)
      let stepIdx = 1  // step 0 is already rendered by SSR — start from step 1
      let tid
      function advance() {
        if (stepIdx >= steps.length) return  // reached the final step — stop, no loop-back
        const { cls, delay } = steps[stepIdx]
        tid = setTimeout(() => {
          varClasses.forEach(c => hub.classList.remove(c))
          hub.classList.add(cls)
          stepIdx++
          advance()
        }, delay)
      }
      advance()
      return () => clearTimeout(tid)
    })
    return () => cleanups.forEach(c => c?.())
  }, [pathname])
}

// Framer's Ticker code component renders its child list twice back-to-back and
// scrolls it with transform: translateX(); Framer's own runtime JS drives that
// loop, which the static export doesn't capture — left alone the strip just sits
// at its SSR translateX(-0px). Because the content is duplicated exactly 2x,
// looping the offset through half of the element's own scrollWidth (rather than a
// hardcoded distance) reads as continuous regardless of how many items or how
// wide the viewport is. Pauses on hover, approximating Framer's hover-slowdown.
function useTickers() {
  const { pathname } = useLocation()
  useEffect(() => {
    const tickers = [...document.querySelectorAll('[data-framer-ticker]')]
    if (!tickers.length) return
    const PX_PER_SEC = 40
    const state = tickers.map(el => ({ el, offset: 0, paused: false }))
    const onEnter = s => () => { s.paused = true }
    const onLeave = s => () => { s.paused = false }
    const listeners = state.map(s => {
      const enter = onEnter(s), leave = onLeave(s)
      s.el.addEventListener('mouseenter', enter)
      s.el.addEventListener('mouseleave', leave)
      return { el: s.el, enter, leave }
    })
    let raf, last = performance.now()
    function tick(now) {
      const dt = Math.min((now - last) / 1000, 0.05)  // clamp to avoid a big jump after a tab switch
      last = now
      for (const s of state) {
        if (s.paused) continue
        const half = s.el.scrollWidth / 2
        if (half <= 0) continue
        s.offset = (s.offset + PX_PER_SEC * dt) % half
        s.el.style.transform = 'translateX(-' + s.offset + 'px)'
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      listeners.forEach(l => { l.el.removeEventListener('mouseenter', l.enter); l.el.removeEventListener('mouseleave', l.leave) })
    }
  }, [pathname])
}

// Framer "fit text" SVG (the oversized footer wordmark): the SSR copy bakes a placeholder box
// (400×100) and the desktop font size; Framer's runtime then measures the text and rewrites the
// font size, box and viewBox to fit the container. Redo that when the baked text overflows.
function useFitSvgText() {
  useEffect(() => {
    const fit = () => {
      for (const svg of document.querySelectorAll('svg[viewBox][preserveAspectRatio="xMidYMid meet"]')) {
        const texts = [...svg.querySelectorAll('text')]
        if (!texts.length || !svg.getClientRects().length) continue
        const box = svg.parentElement
        const orig = (svg.__fitOrig ??= { vb: svg.getAttribute('viewBox'), box: box.getAttribute('style') || '', texts: texts.map(t => [t.getAttribute('x'), t.getAttribute('y'), t.style.fontSize]) })
        // reset to the baked state, then decide again for the current width
        svg.setAttribute('viewBox', orig.vb)
        box.setAttribute('style', orig.box)
        texts.forEach((t, i) => { t.setAttribute('x', orig.texts[i][0]); t.setAttribute('y', orig.texts[i][1]); t.style.fontSize = orig.texts[i][2] })
        // The phone copy is wrong in size too: it carries the desktop font size, so its text is
        // wider than the screen — shrink it to fit.
        const w = document.documentElement.clientWidth
        const bb = texts[0].getBBox()
        const fs0 = parseFloat(getComputedStyle(texts[0]).fontSize)
        if (bb.width <= w) {
          // Desktop/tablet: keep the baked font size, but size the box to the text like Framer does
          // (the SSR placeholder is 400x100, which makes the footer too short and crops the wordmark).
          const bw = Math.ceil(bb.width), bh = Math.round(fs0 * 1.086)
          svg.setAttribute('viewBox', '0 0 ' + bw + ' ' + bh)
          box.style.width = box.style.minWidth = bw + 'px'
          box.style.height = box.style.minHeight = bh + 'px'
          texts.forEach(t => { t.setAttribute('x', bw / 2); t.setAttribute('y', bh / 2) })
          continue
        }
        const fs = fs0 * (w * 0.925) / bb.width
        const h = fs * 0.958
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h)
        box.style.width = box.style.minWidth = w + 'px'
        box.style.height = box.style.minHeight = h + 'px'
        texts.forEach(t => { t.setAttribute('x', w / 2); t.setAttribute('y', h / 2); t.style.fontSize = fs + 'px' })
      }
    }
    fit()
    const id = setTimeout(fit, 600)  // web fonts change the measured width
    window.addEventListener('resize', fit)
    document.fonts?.ready.then(fit)
    return () => { clearTimeout(id); window.removeEventListener('resize', fit) }
  }, [])
}

// Nav hover pill: mark the active link with data-framer-page-link-current
function useNavCurrent() {
  const { pathname } = useLocation()
  useEffect(() => {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || ''
      // Resolve to pathname only for comparison
      let linkPath = ''
      if (href.startsWith('/')) {
        // Already absolute (e.g. "/en/") — compare its path directly
        linkPath = href.split('#')[0].replace(/[/]+$/, '') || '/'
      } else if (!href.startsWith('http')) {
        const stripped = href.startsWith('../') ? href.slice(3) : href.startsWith('./') ? href.slice(2) : href.slice(1)
        linkPath = ('/en/' + stripped.split('#')[0]).replace(/[/]+$/, '') || '/en'
      }
      const curPath = pathname.replace(/[/]+$/, '') || '/en'
      const isCurrent = linkPath === curPath
      if (isCurrent) a.setAttribute('data-framer-page-link-current', 'true')
      else a.removeAttribute('data-framer-page-link-current')
    })
  }, [pathname])
}

// Framer segmented toggle (e.g. pricing Annually/Monthly): make it interactive.
// A toggle = 2 "leaf" [tabindex="0"] elements carrying a framer-v-* variant class, grouped under
// their nearest enclosing tab (Framer wraps each segment in its own *-container div, so the two
// segments are NOT direct siblings — they share a wrapper tab instead). The active segment starts
// with a non-transparent background ("Selected" variant), the other is transparent ("Idle").
// Clicking swaps that styling and flips the variant-hidden crossfade layer whose visible sibling
// has DIFFERENT text (the price) within the toggle's card. State lives in the DOM; both
// appearances ship in the SSR.
function useFramerToggles() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Transparent = no bg, or rgba with alpha < 0.5. Catches both pricing (alpha=0) and
    // Decisions/Reasoning style buttons (rgba(255,255,255,0.1) idle state).
    const alphaOf = bg => { const m = bg.match(/rgba([^,]+,[^,]+,[^,]+,s*([^)]+))/); return m ? parseFloat(m[1]) : (bg&&bg!=='transparent'?1:0); }
    const isTransparent = bg => !bg || bg === 'transparent' || alphaOf(bg) < 0.5
    const pairOf = h => (h.parentElement && h.parentElement.children.length === 2)
      ? { hidden: h, shown: [...h.parentElement.children].find(c => c !== h) } : null
    const isTab = el => el.getAttribute('tabindex') === '0' && /\bframer-v-[a-z0-9]+/.test(el.className || '')
    const tabsAll = [...document.querySelectorAll('[tabindex="0"]')].filter(isTab)
    // Leaf tabs only (a segment never contains another tab).
    const leaves = tabsAll.filter(t => !tabsAll.some(o => o !== t && t.contains(o)))
    const byParent = new Map()
    // Group leaves by nearest ancestor tab (wrapper). If none exists — "orphan" tabs like
    // Decisions/Reasoning buttons that sit in separate *-container divs without a shared wrapper
    // tab — group by the NEAREST COMMON ANCESTOR that contains exactly 2 orphan leaves.
    const orphans = []
    for (const t of leaves) {
      let w = t.parentElement
      while (w && !isTab(w)) w = w.parentElement
      if (w) {
        if (!byParent.has(w)) byParent.set(w, [])
        byParent.get(w).push(t)
      } else {
        orphans.push(t)
      }
    }
    for (const o of orphans) {
      let anc = o.parentElement; let key = null
      while (anc && anc !== document.body) {
        if (orphans.filter(x => anc.contains(x)).length === 2) { key = anc; break }
        anc = anc.parentElement
      }
      if (!key) continue
      if (!byParent.has(key)) byParent.set(key, [])
      if (!byParent.get(key).includes(o)) byParent.get(key).push(o)
    }
    const cleanups = []
    for (const [, tabs] of byParent) {
      if (tabs.length !== 2) continue
      const selTab = tabs.find(t => !isTransparent(getComputedStyle(t).backgroundColor)) || tabs[0]
      const idleTab = tabs.find(t => t !== selTab) || tabs[0]
      // Use getPropertyValue so CSS-var values like "var(--token, rgb(...))" are read verbatim.
      const selStyle = { bg: selTab.style.getPropertyValue('background-color'), sh: selTab.style.getPropertyValue('box-shadow') }
      const idleStyle = { bg: idleTab.style.getPropertyValue('background-color') || 'transparent', sh: idleTab.style.getPropertyValue('box-shadow') || 'none' }
      // Scope = nearest ancestor of the toggle that also contains a "content" crossfade pair —
      // a hidden layer whose visible sibling has DIFFERENT text or different img src.
      const isDiffPair = (a, b) => {
        if (a.textContent.trim() !== b.textContent.trim()) return true
        // For img elements: compare src attribute
        const aImg = a.tagName === 'IMG' ? a : a.querySelector('img')
        const bImg = b.tagName === 'IMG' ? b : b.querySelector('img')
        if (aImg && bImg && aImg.src !== bImg.src) return true
        return false
      }
      const hasContentPair = el => [...el.querySelectorAll('[data-framer-hidden-layer]')].some(h => {
        const p = pairOf(h)
        return p && p.shown && isDiffPair(p.shown, h)
      })
      let card = tabs[0].parentElement
      while (card && card !== document.body && !hasContentPair(card)) card = card.parentElement
      if (!card || card === document.body) card = tabs[0].parentElement
      // Only flip content crossfade pairs (different text/src). Same-text label layers
      // are the per-segment selected/idle styling; leave them to paint() below.
      const pairs = [...card.querySelectorAll('[data-framer-hidden-layer]')].map(pairOf)
        .filter(p => p && p.shown && isDiffPair(p.shown, p.hidden))
      let active = tabs.indexOf(selTab)
      const paint = idx => tabs.forEach((t, i) => {
        const s = i === idx ? selStyle : idleStyle
        t.style.setProperty('background-color', s.bg)
        t.style.setProperty('box-shadow', s.sh)
      })
      // Pre-compute which pairs can use opacity crossfade (both position:absolute).
      // For others fall back to display swap (no animation but correct layout).
      const pairModes = pairs.map(({ hidden, shown }) =>
        getComputedStyle(hidden).position === 'absolute' && getComputedStyle(shown).position === 'absolute'
          ? 'fade' : 'display')
      // Initialise fade pairs: replace display:none with opacity:0 so CSS transition fires.
      pairs.forEach(({ hidden }, idx) => {
        if (pairModes[idx] === 'fade' && getComputedStyle(hidden).display === 'none') {
          hidden.style.display = ''; hidden.style.opacity = '0'
        }
      })
      tabs.forEach((tab, i) => {
        const onClick = () => {
          if (i === active) return
          pairs.forEach(({ hidden, shown }, idx) => {
            if (pairModes[idx] === 'fade') {
              const goingIn = getComputedStyle(hidden).opacity === '0' ? hidden : shown
              const goingOut = goingIn === hidden ? shown : hidden
              goingIn.style.opacity = '1'
              goingOut.style.opacity = '0'
            } else {
              const isHidden = getComputedStyle(hidden).display === 'none'
              hidden.style.display = isHidden ? '' : 'none'
              shown.style.display = isHidden ? 'none' : ''
            }
          })
          active = i
          paint(i)
        }
        tab.style.cursor = 'pointer'
        tab.addEventListener('click', onClick)
        cleanups.push(() => tab.removeEventListener('click', onClick))
      })
    }
    return () => cleanups.forEach(fn => fn())
  }, [pathname])
}

// Carousel photo-card switcher: clicking a card or arrow cycles the active variant.
// Auto-detected from SSR HTML at generation time via detectCarousels().
// container: wraps the whole carousel; itemClass: each nav-dot/card; activeVariant: the
// "selected" framer-v-* class; arrowClass: prev/next buttons; prevVariant: the left-arrow variant.
// cardOnly entries (no itemClass/activeVariant — only ever one item existed in the DOM) instead
// carry cardItems (from a site's cardCarousels config) + cardContentSelectors, and arrows
// cycle by writing each item's fields into the matching elements rather than swapping classes.
const KNOWN_CAROUSELS = [{"container":"framer-t1z7q1","itemClass":"framer-Av2zm","activeVariant":"framer-v-1vokbvy"}]

function useCarousels() {
  const { pathname } = useLocation()
  useEffect(() => {
    const cleanups = []
    for (const cfg of KNOWN_CAROUSELS) {
      for (const container of document.querySelectorAll('.' + cfg.container)) {
        // Card-swap mode: no nav-dot variants to toggle (only ever one item was in the DOM),
        // so arrows instead cycle through a config-supplied item list, writing each item's
        // fields into the DOM via generic CSS-selector → value mappings.
        if (cfg.cardItems?.length) {
          let idx = 0
          const s = cfg.cardContentSelectors || {}
          const applyIdx = (newIdx) => {
            idx = ((newIdx % cfg.cardItems.length) + cfg.cardItems.length) % cfg.cardItems.length
            const item = cfg.cardItems[idx]
            for (const [field, value] of Object.entries(item)) {
              const sel = s[field]
              if (!sel) continue
              for (const el of container.querySelectorAll(sel)) {
                if (el.tagName === 'A') el.setAttribute('href', value)
                else if (el.tagName === 'IMG') el.setAttribute('src', value)
                else el.textContent = value
              }
            }
          }
          for (const arrow of container.querySelectorAll('.' + (cfg.arrowClass || ''))) {
            const isPrev = cfg.prevVariant && arrow.classList.contains(cfg.prevVariant)
            const onArrowClick = (e) => { e.stopPropagation(); applyIdx(idx + (isPrev ? -1 : 1)) }
            arrow.addEventListener('click', onArrowClick)
            arrow.style.cursor = 'pointer'
            cleanups.push(() => arrow.removeEventListener('click', onArrowClick))
          }
          continue
        }

        const items = [...container.querySelectorAll('.' + cfg.itemClass)]
        if (items.length < 2) continue

        for (const item of items) {
          if (!item.dataset.inactiveV) {
            const v = [...item.classList].find(c => /^framer-v-[a-z0-9]+$/.test(c))
            if (v && v !== cfg.activeVariant) item.dataset.inactiveV = v
          }
        }

        const getActiveIdx = () => items.findIndex(el => el.classList.contains(cfg.activeVariant))

        const goTo = (newIdx) => {
          const idx = ((newIdx % items.length) + items.length) % items.length
          const cur = getActiveIdx()
          if (cur === idx) return
          if (cur >= 0) {
            items[cur].classList.remove(cfg.activeVariant)
            const iV = items[cur].dataset.inactiveV
            if (iV) items[cur].classList.add(iV)
          }
          const el = items[idx]
          const iV = el.dataset.inactiveV
          if (iV) el.classList.remove(iV)
          el.classList.add(cfg.activeVariant)
          if (cfg.contentSelectors && cfg.personas?.[idx]) {
            const p = cfg.personas[idx]
            const s = cfg.contentSelectors
            if (s.name) { const t = document.querySelector(s.name + ' p'); if (t) t.textContent = p.name }
            if (s.role) { const t = document.querySelector(s.role + ' p'); if (t) t.textContent = p.role }
            if (s.quote) { const t = document.querySelector(s.quote + ' p'); if (t) t.textContent = p.quote }
          }
        }

        for (let i = 0; i < items.length; i++) {
          const idx = i
          const onItemClick = (e) => { e.stopPropagation(); goTo(idx) }
          items[i].addEventListener('click', onItemClick)
          items[i].style.cursor = 'pointer'
          cleanups.push(() => items[i].removeEventListener('click', onItemClick))
        }

        for (const arrow of container.querySelectorAll('.' + (cfg.arrowClass || ''))) {
          const isPrev = cfg.prevVariant && arrow.classList.contains(cfg.prevVariant)
          const onArrowClick = (e) => { e.stopPropagation(); goTo(getActiveIdx() + (isPrev ? -1 : 1)) }
          arrow.addEventListener('click', onArrowClick)
          arrow.style.cursor = 'pointer'
          cleanups.push(() => arrow.removeEventListener('click', onArrowClick))
        }
      }
    }
    return () => cleanups.forEach(fn => fn())
  }, [pathname])
}

// Toggles captured at extraction time by clicking every candidate on the live
// site (extract-computed.mjs). Each click on a trigger swaps its scope between
// closed/open framer-v-* variants. Grouped by trigger: one click can flip
// several scopes (e.g. hamburger flips its own icon AND the nav panel).
const KNOWN_TOGGLES = [{"trigger":"framer-hToRT","scope":"framer-hToRT","closed":"framer-v-3hvizl","open":"framer-v-4lpinj"},{"trigger":"framer-hToRT","scope":"framer-efFwc","closed":"framer-v-6f0tv4","open":"framer-v-1rb9rj7"},{"trigger":"framer-1za0rk","scope":"framer-hToRT","closed":"framer-v-3hvizl","open":"framer-v-4lpinj"},{"trigger":"framer-1za0rk","scope":"framer-efFwc","closed":"framer-v-6f0tv4","open":"framer-v-1rb9rj7"},{"trigger":"framer-PbhSo","scope":"framer-PbhSo","closed":"framer-v-1q3sp8n","open":"framer-v-1tyskut"},{"trigger":"framer-PbhSo","scope":"framer-EjTLy","closed":"framer-v-n4ddkp","open":"framer-v-1f2erc1"},{"trigger":"framer-1cz19je","scope":"framer-PbhSo","closed":"framer-v-1q3sp8n","open":"framer-v-1tyskut"},{"trigger":"framer-nilz8o","scope":"framer-PbhSo","closed":"framer-v-1q3sp8n","open":"framer-v-1tyskut"},{"trigger":"framer-grhfw5","scope":"framer-PbhSo","closed":"framer-v-1q3sp8n","open":"framer-v-1tyskut"},{"trigger":"framer-13bvw43","scope":"framer-PbhSo","closed":"framer-v-1q3sp8n","open":"framer-v-1tyskut"},{"trigger":"framer-v7gp4y","scope":"framer-EjTLy","closed":"framer-v-1o0ggv6","open":"framer-v-1w1amsb"}]

function useClickToggles() {
  const { pathname } = useLocation()
  useEffect(() => {
    const cleanups = []
    // ── Extracted toggles: exact, site-agnostic, work anywhere on the page ──
    const byTrigger = new Map()
    for (const t of KNOWN_TOGGLES) {
      if (!byTrigger.has(t.trigger)) byTrigger.set(t.trigger, [])
      byTrigger.get(t.trigger).push(t)
    }
    // Framer's SSR emits one copy of the nav per responsive breakpoint, all present
    // in the DOM with only the current one displayed. Binding to the first match
    // would wire up an invisible copy, so bind every copy and resolve each scope
    // relative to the trigger that was actually clicked.
    const isVisible = el => !!(el.offsetParent || el.getClientRects().length)
    const knownTriggers = new Set()
    for (const [trigger, scopes] of byTrigger) {
      const els = document.querySelectorAll('.' + trigger)
      if (!els.length) continue
      knownTriggers.add(trigger)
      for (const el of els) {
        const onClick = (e) => {
          // A real link inside the trigger (e.g. nav items in a toggleable menu) must navigate,
          // not toggle: extraction can record the whole nav as its own trigger.
          if (e.target.closest('a[href]:not([href^="#"]):not([href=""])')) return
          e.preventDefault()
          e.stopPropagation()
          for (const t of scopes) {
            // Prefer the scope containing this trigger, then any visible copy.
            const candidates = [...document.querySelectorAll('.' + t.scope)]
            const scopeEl = el.closest('.' + t.scope)
              || candidates.find(isVisible)
              || candidates[0]
            if (!scopeEl) continue
            const cur = [...scopeEl.classList].find(c => /^framer-v-[a-z0-9]+$/.test(c))
            if (!cur) continue
            const isCurrentlyOpen = cur === t.open
            if (isCurrentlyOpen) {
              // Restore to original closed variant (saved before opening, fallback to t.closed)
              const savedClosed = scopeEl.dataset.closedVariant || t.closed
              scopeEl.classList.remove(cur)
              scopeEl.classList.add(savedClosed)
            } else {
              // Save current closed variant for restoration, switch to open
              scopeEl.dataset.closedVariant = cur
              scopeEl.classList.remove(cur)
              scopeEl.classList.add(t.open)
            }
          }
        }
        el.style.cursor = 'pointer'
        el.addEventListener('click', onClick)
        cleanups.push(() => el.removeEventListener('click', onClick))
      }
    }

    // ── Fallback: runtime probing for toggles missed at extraction time ──
    const variantEls = document.querySelectorAll('[class*="framer-v-"]')
    for (const variantEl of variantEls) {
      const parentCls = variantEl.className
      const scopeClass = parentCls.split(/\s+/).find(c => /^framer-[A-Za-z0-9]{4,}$/.test(c) && !c.startsWith('framer-v-'))
      if (!scopeClass) continue
      const clickables = variantEl.querySelectorAll('*')
      for (const el of clickables) {
        const cs = getComputedStyle(el)
        if (cs.cursor !== 'pointer') continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        if (el.tagName === 'A') {
          const href = el.getAttribute('href') || ''
          if (href && href !== '#' && !href.startsWith('#')) continue
        }
        if (rect.width > 200 && rect.height > 100) continue
        const elCls = el.className?.toString() || ''
        if (!/framer-v-/.test(elCls)) continue
        const elScope = elCls.split(/\s+/).find(c => /^framer-[A-Za-z0-9]{4,}$/.test(c) && !c.startsWith('framer-v-'))
        if (!elScope) continue
        if (knownTriggers.has(elScope)) continue  // handled by KNOWN_TOGGLES above
        let isInNav = false
        let ancestor = el.parentElement
        while (ancestor && ancestor !== document.body) {
          if (getComputedStyle(ancestor).position === 'fixed') { isInNav = true; break }
          ancestor = ancestor.parentElement
        }
        if (!isInNav) continue
        let variantAncestor = el.parentElement
        while (variantAncestor && variantAncestor !== document.body) {
          const aCls = variantAncestor.className?.toString() || ''
          if (/framer-v-/.test(aCls)) {
            const aScope = aCls.split(/\s+/).find(c => /^framer-[A-Za-z0-9]{4,}$/.test(c) && !c.startsWith('framer-v-'))
            if (aScope && aScope !== elScope) break
          }
          variantAncestor = variantAncestor.parentElement
        }
        if (!variantAncestor || variantAncestor === document.body) continue
        const ancestorScope = variantAncestor.className.split(/\s+/).find(c => /^framer-[A-Za-z0-9]{4,}$/.test(c) && !c.startsWith('framer-v-'))
        if (!ancestorScope) continue
        const allStyles = document.styleSheets
        const variantSet = new Set()
        try {
          for (const sheet of allStyles) {
            try {
              for (const rule of sheet.cssRules) {
                const sel = rule.selectorText || ''
                const m = sel.match(new RegExp('\\.'+ancestorScope+'\\.framer-v-([a-z0-9]+)'))
                if (m) variantSet.add('framer-v-' + m[1])
              }
            } catch {}
          }
        } catch {}
        if (variantSet.size < 2) continue
        const currentVariant = variantAncestor.className.split(/\s+/).find(c => /^framer-v-[a-z0-9]+$/.test(c))
        if (!currentVariant) continue
        const otherVariants = [...variantSet].filter(v => v !== currentVariant)
        if (otherVariants.length === 0) continue
        const childPanels = variantAncestor.querySelectorAll('[class*="framer-"]')
        let bestVariant = otherVariants[0]
        let bestDelta = 0
        const baseHeights = new Map()
        for (const cp of childPanels) baseHeights.set(cp, cp.getBoundingClientRect().height)
        for (const v of otherVariants) {
          variantAncestor.classList.remove(currentVariant)
          variantAncestor.classList.add(v)
          let maxDelta = 0
          for (const cp of childPanels) {
            const delta = cp.getBoundingClientRect().height - (baseHeights.get(cp) || 0)
            if (delta > maxDelta) maxDelta = delta
          }
          variantAncestor.classList.remove(v)
          variantAncestor.classList.add(currentVariant)
          if (maxDelta > bestDelta) { bestDelta = maxDelta; bestVariant = v }
        }
        if (bestDelta === 0) continue
        const toggleVariant = bestVariant
        let isOpen = false
        const onClick = (e) => {
          // A real link inside the trigger (e.g. nav items in a toggleable menu) must navigate,
          // not toggle: extraction can record the whole nav as its own trigger.
          if (e.target.closest('a[href]:not([href^="#"]):not([href=""])')) return
          e.preventDefault()
          e.stopPropagation()
          isOpen = !isOpen
          const target = isOpen ? toggleVariant : currentVariant
          const curV = variantAncestor.className.split(/\s+/).find(c => /^framer-v-[a-z0-9]+$/.test(c))
          if (curV) variantAncestor.classList.remove(curV)
          variantAncestor.classList.add(target)
        }
        el.addEventListener('click', onClick)
        cleanups.push(() => el.removeEventListener('click', onClick))
      }
    }
    return () => cleanups.forEach(fn => fn())
  }, [pathname])
}

// M9: re-split data-stagger="char|word" text into animated spans on scroll entry.
// Timing pulled from the site's own compiled bundle (search "tokenization:" +
// "transition:" in the exported .mjs chunks — Framer's Text Effects feature bakes
// {bounce,delay,duration,type:'spring'} per element) rather than guessed: character
// mode runs delay .02-.03s/duration .03s across every instance found; word mode
// varies per-instance (.02-.18s delay, .05-.15s duration) but clusters most often at
// delay .08s/duration .15s, which is what's used here as the representative default.
// All observed instances animate opacity only (x:0,y:0) — no slide.
function useStaggerText() {
  const { pathname } = useLocation()
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-stagger]')]
    if (!els.length) return
    els.forEach(el => {
      const type = el.dataset.stagger
      const raw = el.textContent
      if (!raw.trim()) return
      const delay = type === 'char' ? 25 : 80
      const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      const unitClass = type === 'char' ? 'sg-u sg-u-char' : 'sg-u sg-u-word'
      if (type === 'char') {
        // Each char span is inline-block, and adjacent atomic inline boxes are a valid
        // break opportunity — so per-char spans alone wrap mid-word. Group each word's
        // chars in a nowrap wrapper; only the whitespace between wrappers can break.
        let i = 0
        el.innerHTML = raw.split(/(\s+)/).map(tok => {
          if (!tok.trim()) return tok
          const chars = [...tok].map(c =>
            `<span class="${unitClass}" style="animation-delay:${i++ * delay}ms">${esc(c)}</span>`
          ).join('')
          return `<span class="sg-w">${chars}</span>`
        }).join('')
      } else {
        el.innerHTML = raw.trim().split(/\s+/).map((w, i) =>
          `<span class="${unitClass}" style="animation-delay:${i * delay}ms">${esc(w)}</span>`
        ).join(' ')
      }
      el.dataset.staggerReady = '1'
    })
    // IntersectionObserver rather than a scroll listener + manual math: the old
    // version ran its only non-scroll check at mount, so if layout wasn't settled
    // yet (innerHeight still 0, fonts pending) nothing was revealed and the text
    // stayed at opacity:0 until the user happened to scroll.
    const pending = new Set(els)
    const io = new IntersectionObserver(entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('sg-play')
        io.unobserve(e.target)
        pending.delete(e.target)
      }
      if (!pending.size) io.disconnect()
    }, { rootMargin: '0px 0px -10% 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [pathname])
}
function LangWrapper() {
  useScrollAppear()
  useStaggerText()
  useScrollBg()
  useHubCycle()
  useTickers()
  useNavCurrent()
  useFitSvgText()
  useRevealText({"radius":20,"hoverIn":0.8,"hoverOut":0.7,"gridOpacity":0.44,"gridHeight":744,"grid":{"backgroundColor":"rgb(74, 64, 55)","gridColor":"rgba(250, 214, 179, 0.93)","dotColor":"rgba(250, 214, 179, 0.93)","hoverColor":"rgb(245, 109, 95)","gridSize":25,"repulsionStrength":-0.28,"radius":260,"dotSize":1.7,"gridThickness":0.2,"baseOpacity":0.28,"motionSpeed":0.5}})
  useFramerToggles()
  useClickToggles()
  useCarousels()
  return <Outlet />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/en" replace />} />

      <Route path="/en" element={<LangWrapper />}>
        <Route index element={<HomePage />} />
        <Route path="*" element={<_404Page />} />
        <Route path="blogs/how-to-create-a-lead-magnet-that-actually-converts" element={<BlogsHowToCreateALeadMagnetThatActuallyConvertsPage />} />
        <Route path="blogs/how-to-turn-social-media-attention-into-real-revenue" element={<BlogsHowToTurnSocialMediaAttentionIntoRealRevenuePage />} />
        <Route path="blogs/metrics-that-actually-matter-in-2025" element={<BlogsMetricsThatActuallyMatterIn2025Page />} />
        <Route path="blogs/repurpose-like-a-pro-turn-1-post-into-10" element={<BlogsRepurposeLikeAProTurn1PostInto10Page />} />
        <Route path="blogs/the-real-reason-your-website-isn%E2%80%99t-converting-visitors" element={<BlogsTheRealReasonYourWebsiteIsnE28099tConvertingVisitorsPage />} />
        <Route path="blogs/why-data-driven-marketing-outperforms-guesswork-every-time" element={<BlogsWhyDataDrivenMarketingOutperformsGuessworkEveryTimePage />} />
        <Route path="blogs/why-most-marketing-campaigns-fail-before-they-ever-launch" element={<BlogsWhyMostMarketingCampaignsFailBeforeTheyEverLaunchPage />} />
        <Route path="blogs/why-your-brand-voice-matters-more-than-ever" element={<BlogsWhyYourBrandVoiceMattersMoreThanEverPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="case-study/building-a-scalable-content-engine-for-elevate-labs" element={<CaseStudyBuildingAScalableContentEngineForElevateLabsPage />} />
        <Route path="case-study/doubling-local-leads-for-urbanfix-without-increasing-ad-spend" element={<CaseStudyDoublingLocalLeadsForUrbanfixWithoutIncreasingAdSpendPage />} />
        <Route path="case-study/from-low-quality-leads-to-enterprise-demos" element={<CaseStudyFromLowQualityLeadsToEnterpriseDemosPage />} />
        <Route path="case-study/how-creative-testing-increased-aurora-revenue" element={<CaseStudyHowCreativeTestingIncreasedAuroraRevenuePage />} />
        <Route path="case-study/how-we-scaled-a-fitness-brand-in-90-days" element={<CaseStudyHowWeScaledAFitnessBrandIn90DaysPage />} />
        <Route path="case-study/repositioning-nexa-consulting-to-increase-conversions-by-61" element={<CaseStudyRepositioningNexaConsultingToIncreaseConversionsBy61Page />} />
        <Route path="case-study" element={<CaseStudyPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="legal/privacy" element={<LegalPrivacyPage />} />
        <Route path="legal/terms-of-service" element={<LegalTermsOfServicePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/en/404" replace />} />
    </Routes>
  )
}
