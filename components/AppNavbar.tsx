"use client"

import Link from "next/link"
import { createPortal } from "react-dom"
import { useCallback, useMemo, useState, useEffect, useRef, type FocusEvent } from "react"
import { usePathname } from "next/navigation"
import { ChevronDown, LogOut } from "lucide-react"

import { cn } from "@/lib/utils"
import { NotificationsMenu, type NavbarNotification } from "@/components/NotificationsMenu"
import { LIST_MENU_ITEMS, type ListMenuItem } from "@/components/navigation/list-menu-items"

type NavChild = ListMenuItem

type NavItem = {
  href?: string
  label: string
  requiresComissao?: boolean
  children?: NavChild[]
}

const NAV_ITEMS: NavItem[] = [
  { href: "/resumo", label: "Resumo" },
  { label: "Listas", children: LIST_MENU_ITEMS },
  { href: "/tds", label: "TDs" },
  { href: "/vacancias", label: "Vacâncias" },
  { href: "/comissao", label: "Comissão", requiresComissao: true },
]

type AppNavbarProps = {
  isComissao?: boolean
  notifications?: NavbarNotification[]
}

export function AppNavbar({ isComissao = false, notifications = [] }: AppNavbarProps) {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const navContainerRef = useRef<HTMLDivElement | null>(null)
  const dropdownContainerRef = useRef<HTMLDivElement | null>(null)
  const dropdownAnchorsRef = useRef<Record<string, HTMLButtonElement | null>>({})
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const [isMounted, setIsMounted] = useState(false)

  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => (item.requiresComissao ? isComissao : true)),
    [isComissao],
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setOpenDropdown(null)
  }, [pathname])

  const updateDropdownPosition = useCallback(
    (label: string | null) => {
      if (!label) return
      const trigger = dropdownAnchorsRef.current[label]
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      setDropdownPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    },
    [],
  )

  useEffect(() => {
    if (!openDropdown) {
      return
    }

    updateDropdownPosition(openDropdown)

    const handleResize = () => updateDropdownPosition(openDropdown)
    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleResize, true)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleResize, true)
    }
  }, [openDropdown, updateDropdownPosition])

  const isItemActive = (item: NavItem) => {
    if (item.children?.length) {
      return item.children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))
    }

    if (!item.href) return false

    return pathname === item.href || pathname.startsWith(`${item.href}/`)
  }

  const handleDropdownToggle = (label: string) => {
    setOpenDropdown((current) => (current === label ? null : label))
  }

  const handleDropdownClose = () => {
    setOpenDropdown(null)
  }

  const handleBlur = (event: FocusEvent<HTMLElement>, label: string) => {
    if (openDropdown !== label) {
      return
    }

    const nextTarget = event.relatedTarget as Node | null

    if (event.currentTarget.contains(nextTarget)) {
      return
    }

    if (nextTarget && dropdownContainerRef.current?.contains(nextTarget)) {
      return
    }

    setOpenDropdown(null)
  }

  useEffect(() => {
    if (!openDropdown) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (navContainerRef.current?.contains(target)) {
        return
      }
      if (dropdownContainerRef.current?.contains(target)) {
        return
      }
      setOpenDropdown(null)
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [openDropdown])

  return (
    <header className="sticky top-0 z-40 hidden bg-[#01426A] text-white md:block">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex flex-1 items-center">
          <span className="font-display text-lg text-white whitespace-nowrap">Aprovados TJAA · TRT-2</span>
        </div>

        <nav className="flex flex-1 items-center justify-center">
          <div ref={navContainerRef} className="flex max-w-full overflow-x-auto overflow-y-visible px-3">
            <ul className="flex flex-nowrap items-center justify-center gap-2 md:gap-3">
              {navItems.map((item) => {
                const isComissaoTab = item.href === "/comissao"
                const baseClasses = "inline-flex items-center rounded-full px-4 py-2 text-xs font-display transition-colors whitespace-nowrap md:text-sm"
                const active = isItemActive(item)

                if (item.children?.length) {
                  const isOpen = openDropdown === item.label
                  const dropdownId = `${item.label.toLowerCase().replace(/\s+/g, "-")}-menu`
                  const triggerClasses = cn(
                    baseClasses,
                    active || isOpen ? "bg-white text-[#01426A]" : "bg-[#0067A0] text-white hover:bg-white/10",
                  )

                  return (
                    <li
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(item.label)}
                      onFocus={() => setOpenDropdown(item.label)}
                      onBlur={(event) => handleBlur(event, item.label)}
                    >
                      <button
                        type="button"
                        ref={(element) => {
                          dropdownAnchorsRef.current[item.label] = element
                        }}
                        className={cn(triggerClasses, "gap-1.5")}
                        aria-haspopup="true"
                        aria-expanded={isOpen}
                        aria-controls={dropdownId}
                        onClick={() => handleDropdownToggle(item.label)}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          aria-hidden="true"
                          className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : "")}
                        />
                      </button>
                      {isMounted && isOpen &&
                        createPortal(
                          <div
                            ref={dropdownContainerRef}
                            id={dropdownId}
                            style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
                            className="fixed z-50 w-56 -translate-x-1/2 rounded-2xl border border-white/25 bg-white/95 p-2 text-[#01426A] shadow-[0_18px_44px_rgba(1,66,106,0.32)]"
                          >
                            <ul className="space-y-1">
                              {item.children.map((child) => (
                                <li key={child.href}>
                                  <Link
                                    href={child.href}
                                    className={cn(
                                      "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                                      pathname === child.href
                                        ? "bg-[#01426A] text-white"
                                        : "text-[#01426A] hover:bg-[#01426A]/10",
                                    )}
                                    onClick={handleDropdownClose}
                                  >
                                    {child.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>,
                          document.body,
                        )}
                    </li>
                  )
                }

                if (!item.href) {
                  return null
                }

                const linkClasses = isComissaoTab
                  ? cn(baseClasses, "bg-[#FFCD00] text-[#01426A] hover:brightness-95")
                  : cn(
                      baseClasses,
                      active ? "bg-white text-[#01426A]" : "bg-[#0067A0] text-white hover:bg-white/10",
                    )

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={linkClasses}>
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <NotificationsMenu notifications={notifications} />
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/16 px-4 py-2 text-[12px] font-medium text-white/90 shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition hover:border-white/45 hover:bg-white/24 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Sair</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
