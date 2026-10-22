// Scroll-appear is handled globally by useScrollAppear in App.jsx (getBoundingClientRect-based).
// IntersectionObserver is not used because Framer's overflow:clip on ancestors blocks IO callbacks.
export function useFramerAppear() {}
