import { useState } from "react";
import { type Transition } from "framer-motion";
import { Tab } from "../types";

const tabOrder: Record<Tab, number> = {
  chat: 0,
  tools: 1,
  settings: 2,
};

export const pageVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 100 : -100,
    scale: 0.98,
  }),
  animate: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -100 : 100,
    scale: 0.98,
  }),
};

export const pageTransition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export function usePageTransition(initialTab: Tab = "chat") {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [direction, setDirection] = useState(0);

  const handleTabChange = (newTab: Tab) => {
    const currentIndex = tabOrder[activeTab];
    const newIndex = tabOrder[newTab];
    setDirection(newIndex - currentIndex);
    setActiveTab(newTab);
  };

  return {
    activeTab,
    direction,
    handleTabChange,
    pageVariants,
    pageTransition,
  };
}