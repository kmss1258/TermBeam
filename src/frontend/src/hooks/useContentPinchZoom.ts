import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * True visual pinch-to-zoom — scales content like a magnifying glass.
 *
 * How it works:
 * 1. The target element is given a fixed pixel width matching the container
 *    so its layout never changes regardless of scale.
 * 2. CSS transform: scale() is applied to visually enlarge everything uniformly
 *    (text, images, diagrams — all as rendered pixels).
 * 3. A spacer div is resized to the scaled dimensions so the container's
 *    native overflow scroll handles panning.
 */
export function useContentPinchZoom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  targetRef: React.RefObject<HTMLDivElement | null>,
  spacerRef: React.RefObject<HTMLDivElement | null>,
) {
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
  const startDistRef = useRef(0);
  const startScaleRef = useRef(1);
  const isPinchingRef = useRef(false);
  const baseWidthRef = useRef(0);

  const applyZoom = useCallback(
    (s: number) => {
      const target = targetRef.current;
      const spacer = spacerRef.current;
      if (!target) return;

      if (s <= 1.02) {
        target.style.transform = '';
        target.style.transformOrigin = '';
        target.style.width = '';
        target.style.position = '';
        if (spacer) {
          spacer.style.width = '';
          spacer.style.height = '';
        }
      } else {
        // Lock the target to its natural width so layout doesn't change
        if (!baseWidthRef.current) {
          baseWidthRef.current = target.offsetWidth;
        }
        target.style.width = `${baseWidthRef.current}px`;
        target.style.transformOrigin = '0 0';
        target.style.transform = `scale(${s})`;
        target.style.position = 'absolute';
        target.style.top = '0';
        target.style.left = '0';
        // Spacer provides scroll dimensions
        if (spacer) {
          spacer.style.width = `${baseWidthRef.current * s}px`;
          spacer.style.height = `${target.scrollHeight * s}px`;
        }
      }
    },
    [targetRef, spacerRef],
  );

  const resetZoom = useCallback(() => {
    scaleRef.current = 1;
    baseWidthRef.current = 0;
    setScale(1);
    applyZoom(1);
  }, [applyZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function getDistance(t0: Touch, t1: Touch): number {
      const dx = t1.clientX - t0.clientX;
      const dy = t1.clientY - t0.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (e.touches.length === 2 && t0 && t1) {
        e.preventDefault();
        isPinchingRef.current = true;
        startDistRef.current = getDistance(t0, t1);
        startScaleRef.current = scaleRef.current;
      }
    }

    function onTouchMove(e: TouchEvent) {
      const t0 = e.touches[0];
      const t1 = e.touches[1];
      if (e.touches.length === 2 && t0 && t1 && isPinchingRef.current && container) {
        e.preventDefault();
        const dist = getDistance(t0, t1);
        const oldScale = scaleRef.current;
        const newScale = Math.min(5, Math.max(1, startScaleRef.current * (dist / startDistRef.current)));

        // Pinch midpoint relative to the container viewport
        const rect = container.getBoundingClientRect();
        const midX = (t0.clientX + t1.clientX) / 2 - rect.left;
        const midY = (t0.clientY + t1.clientY) / 2 - rect.top;

        // Content coordinate under the pinch midpoint (at old scale)
        const contentX = (container.scrollLeft + midX) / oldScale;
        const contentY = (container.scrollTop + midY) / oldScale;

        scaleRef.current = newScale;
        setScale(newScale);
        applyZoom(newScale);

        // Scroll so the same content point stays under the pinch midpoint
        container.scrollLeft = contentX * newScale - midX;
        container.scrollTop = contentY * newScale - midY;
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2 && isPinchingRef.current) {
        isPinchingRef.current = false;
        startDistRef.current = 0;
        if (scaleRef.current < 1.05) {
          scaleRef.current = 1;
          baseWidthRef.current = 0;
          setScale(1);
          applyZoom(1);
        }
      }
    }

    container.addEventListener('touchstart', onTouchStart, { passive: false });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd);

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [containerRef, targetRef, applyZoom]);

  return { scale, resetZoom };
}
