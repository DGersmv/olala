"use client"

import type React from "react"
import { L1 } from "./shop-layer1"
import { L2 } from "./shop-layer2"
import { L3 } from "./shop-layer3"

interface ShopSvgProps {
  /** 0 = hidden, 1 = вывеска, 2 = +вход/дверь, 3 = +цветы */
  phase: number
  className?: string
}

export function ShopSvg({ phase, className }: ShopSvgProps) {
  const tr = (show: boolean): React.CSSProperties => ({
    opacity: show ? 1 : 0,
    transition: "opacity 1.4s ease",
  })
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 706 965"
      preserveAspectRatio="xMidYMid meet"
      className={className}
    >
      <g transform="translate(0,965) scale(0.1,-0.1)" fill="currentColor" stroke="none">
        <g style={tr(phase >= 1)} dangerouslySetInnerHTML={{ __html: L2 }} />
        <g style={tr(phase >= 2)} dangerouslySetInnerHTML={{ __html: L3 }} />
        <g style={tr(phase >= 3)} dangerouslySetInnerHTML={{ __html: L1 }} />
      </g>
    </svg>
  )
}
