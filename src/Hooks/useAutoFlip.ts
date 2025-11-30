import { useState, useLayoutEffect, RefObject } from "react";

export function useAutoFlip(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  menuHeight = 400
) {
  const [position, setPosition] = useState<"top" | "bottom">("bottom");

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < menuHeight) {
      setPosition("top");
    } else {
      setPosition("bottom");
    }
  }, [isOpen, triggerRef, menuHeight]);

  return position;
}