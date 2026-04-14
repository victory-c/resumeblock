"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BookOpen,
  Upload,
  Briefcase,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OllamaStatusIndicator } from "./OllamaStatusIndicator"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/blocks", label: "Block Library", icon: BookOpen },
  { href: "/import", label: "Import Resume", icon: Upload },
  { href: "/applications", label: "Applications", icon: Briefcase },
  { href: "/templates", label: "Templates", icon: FileText },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="font-semibold tracking-tight">ResumeBlock</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t p-3">
        <OllamaStatusIndicator />
      </div>
    </aside>
  )
}
