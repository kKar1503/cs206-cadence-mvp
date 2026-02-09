"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

interface FadeInSectionProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInSection({ children, delay = 0, className }: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: "easeOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggeredGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggeredGrid({ children, className, staggerDelay = 0.15 }: StaggeredGridProps) {
  const childArray = Array.isArray(children) ? children : [children];

  return (
    <div className={className}>
      {childArray.map((child, index) => (
        <FadeInSection key={index} delay={index * staggerDelay}>
          {child}
        </FadeInSection>
      ))}
    </div>
  );
}
