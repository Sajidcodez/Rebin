"use client"
import React from "react";
import {Button} from "../ui/button"
import { NavLink } from "../ui/navLink"
import { Icons } from "../ui/icons"
import { useState } from "react"

export function Header() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

     const navItems = [
        { href: "#home", label: "Home" },
        { href: "#mission", label: "Mission" },
        { href: "#features", label: "Features" },
        { href: "#impact", label: "Impact" },
      ]


      return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                  <Icons.leaf className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">ReBin</span>
              </div>
  {/* Desktop Navigation */}
  <nav className ="hidden md:flex items-center gap-6">
  {navItems.map((item) => (
              <NavLink key={item.href} href={item.href}>
                {item.label}
              </NavLink>
            ))}
             <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
             </nav>
             {/* Mobile Menu Button *\}
            {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <Icons.x className="h-6 w-6" /> : <Icons.menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 space-y-4 border-t border-border/40">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                {item.label}
              </NavLink>
            ))}
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
          </nav>
        )}
      </div>
    </header>
  )
}
