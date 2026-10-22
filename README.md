# strategize-react

An unofficial React + Vite port of the **Strategize** marketing-agency Framer template
(https://strategize.framer.website), produced with a Framer → React migrator.

**Live demo:** https://strategize-react.vercel.app

## Licensing and attribution

The design, layout, copy, images, icons and fonts in this project come from the *Strategize* Framer
template and remain the property of its author (and, for the fonts, their respective foundries).
This repository grants no rights to them. Only the port's own code (the React/Vite setup, the hooks
and the hand-written components under `src/components/custom/` and `src/hooks/`) is offered for reuse.

To use the template's design or content in a real project you need a valid license for the template
from its author, obtained through Framer. Do not present this port as an original design.

## Run

```bash
npm install
npm run dev      # http://localhost:3070/en
npm run build
```

All fonts, images, the favicon and the social-card image are served from `public/` — the build makes no
requests to Framer's CDN or to other third-party asset hosts.

## What is in here

- `src/pages/` – one generated page component per Framer page (home, blogs, case studies, contact, legal, 404).
- `src/components/custom/` – hand-ported Framer code components: `KineticGrid` (cursor-reactive canvas grid),
  `FramerShader` (WebGL animated gradient behind the call-to-action) and `useRevealText` (grid revealed
  inside the footer wordmark on hover).
- `src/hooks/` – `hoverLayout` (Framer hover variants incl. label slide), `InView` (scroll-in animations).
- `src/hover-diffs.json` – per-variant hover styles used by the pages.
