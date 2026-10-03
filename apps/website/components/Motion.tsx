'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import type { gsap as GsapCore } from 'gsap';
import type { ScrollTrigger as ScrollTriggerCore } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';

/**
 * The site's only motion runtime, mounted once in the layout.
 *
 *  - Navbar: marks <header data-scrolled> once the page scrolls (styling only, no motion).
 *  - Lenis smooth scrolling, synced with GSAP's ticker and ScrollTrigger.
 *  - Scroll reveals: [data-reveal] fades/rises in; [data-reveal-stagger] does the same
 *    for its children, staggered.
 *
 * Content is visible in the server HTML. Only elements still BELOW the fold when this
 * runs are hidden and then revealed — nothing above the fold flickers, and nothing stays
 * hidden if JavaScript fails. With prefers-reduced-motion nothing animates and Lenis
 * isn't started. GSAP and Lenis load after hydration, off the critical path.
 */

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type Gsap = typeof GsapCore;
type Trigger = typeof ScrollTriggerCore;

let libs: Promise<{ gsap: Gsap; ScrollTrigger: Trigger }> | null = null;
function loadGsap() {
  libs ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
    ([{ gsap }, { ScrollTrigger }]) => {
      gsap.registerPlugin(ScrollTrigger);
      return { gsap, ScrollTrigger };
    },
  );
  return libs;
}

let lenis: Lenis | null = null;

export function Motion() {
  const pathname = usePathname();

  // Navbar state: transparent-ish at the top, glass with a hairline once scrolled.
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    if (!header) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      header.toggleAttribute('data-scrolled', window.scrollY > 8);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Smooth scrolling, once for the app's lifetime (the layout never unmounts).
  useEffect(() => {
    if (reducedMotion()) return;
    let cancelled = false;
    let tick: ((time: number) => void) | null = null;
    void Promise.all([loadGsap(), import('lenis')]).then(
      ([{ gsap, ScrollTrigger }, { default: LenisClass }]) => {
        if (cancelled) return;
        // Wheel/trackpad only: touch devices keep native scrolling.
        lenis = new LenisClass({ autoRaf: false, anchors: { offset: -80 }, lerp: 0.12 });
        lenis.on('scroll', ScrollTrigger.update);
        tick = (time) => lenis?.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      },
    );
    return () => {
      cancelled = true;
      void loadGsap().then(({ gsap }) => tick && gsap.ticker.remove(tick));
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // Scroll reveals, re-scanned on every client-side navigation.
  useEffect(() => {
    if (reducedMotion()) return;
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;
    void loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled) return;
      lenis?.resize();
      const fold = window.innerHeight * 0.92;
      const below = (el: Element) => el.getBoundingClientRect().top > fold;
      ctx = gsap.context(() => {
        const reveal = (targets: Element[], trigger: Element, stagger = 0) => {
          gsap.set(targets, { autoAlpha: 0, y: 20 });
          gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
            stagger,
            clearProps: 'transform,opacity,visibility',
            scrollTrigger: { trigger, start: 'top 88%', once: true },
          });
        };
        document.querySelectorAll('[data-reveal]').forEach((el) => {
          if (below(el)) reveal([el], el);
        });
        document.querySelectorAll('[data-reveal-stagger]').forEach((group) => {
          const items = [...group.children].filter(below);
          if (items.length) reveal(items, items[0]!, 0.07);
        });
      });
      ScrollTrigger.refresh();
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
