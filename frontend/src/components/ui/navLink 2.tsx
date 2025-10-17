"use client"

import type React from "react"

interface NavLinkProps {
  href: string
  children: React.ReactNode
  onClick?: () => void
}

export function NavLink({ href, children, onClick }: NavLinkProps) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-foreground hover:text-primary transition-colors"
      onClick={onClick}
    >
      {children}
    </a>
  )
}
