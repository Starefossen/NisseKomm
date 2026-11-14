"use client";

import { useEffect } from "react";
import { fyll, harTegn, settFamilie } from "@/lib/navn";

const ATTR = ["placeholder", "title", "aria-label", "alt"];

/**
 * Fills name tokens in rendered text after login. React only rewrites a text
 * node when its value changes, and then the observer fills it again.
 * ponytail: DOM-wide observer; canvas text and stored values call fyll() themselves.
 */
export function FamilieNavn() {
  useEffect(() => {
    let lastet = false;
    let sist = 0;
    const last = () => {
      if (lastet || Date.now() - sist < 5000) return;
      sist = Date.now();
      fetch("/api/familie")
        .then((r) => (r.ok ? r.json() : null))
        .then((f) => {
          if (!f) return;
          lastet = true;
          settFamilie(f);
          gå(document.body);
          document.title = fyll(document.title);
        })
        .catch(() => {});
    };
    const tekst = (n: Node) => {
      const v = n.nodeValue;
      if (!v || !harTegn(v)) return;
      const ny = fyll(v);
      if (ny !== v) n.nodeValue = ny;
      else last();
    };
    const element = (el: Element) => {
      for (const a of ATTR) {
        const v = el.getAttribute(a);
        if (v && harTegn(v)) {
          const ny = fyll(v);
          if (ny !== v) el.setAttribute(a, ny);
          else last();
        }
      }
    };
    const gå = (rot: Node) => {
      if (rot.nodeType === Node.TEXT_NODE) return tekst(rot);
      if (rot.nodeType !== Node.ELEMENT_NODE) return;
      element(rot as Element);
      const w = document.createTreeWalker(
        rot,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      );
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (n.nodeType === Node.TEXT_NODE) tekst(n);
        else element(n as Element);
      }
    };
    const obs = new MutationObserver((ms) => {
      for (const m of ms) {
        if (m.type === "characterData") tekst(m.target);
        else if (m.type === "attributes") element(m.target as Element);
        else m.addedNodes.forEach(gå);
      }
    });
    obs.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTR,
    });
    gå(document.body);
    last();
    return () => obs.disconnect();
  }, []);
  return null;
}
