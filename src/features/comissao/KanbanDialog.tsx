"use client"

import type { ReactNode } from "react"

import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const sizeClasses = {
  narrow: "md:max-w-[640px]",
  medium: "md:max-w-[820px]",
  large: "md:max-w-[940px]",
  wide: "md:max-w-[1080px]",
  xl: "md:max-w-[1240px]",
}

type KanbanDialogContentProps = {
  children: ReactNode
  size?: keyof typeof sizeClasses
  className?: string
}

export function KanbanDialogContent({ children, size = "medium", className }: KanbanDialogContentProps) {
  return (
    <DialogContent
      className={cn(
        "flex max-h-[90vh] w-full max-w-[96vw] flex-col overflow-hidden bg-transparent p-0 text-[#0f2f47] md:h-auto md:w-full md:max-h-[85vh]",
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </DialogContent>
  )
}

type KanbanDialogHeaderProps = {
  title: string
  description?: ReactNode
}

export function KanbanDialogHeader({ title, description }: KanbanDialogHeaderProps) {
  return (
    <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b border-[#0f2f47]/12 px-6 py-4">
      <div className="space-y-1">
        <DialogTitle className="font-display text-xl font-semibold text-[#0f2f47]">{title}</DialogTitle>
        {description ? <DialogDescription className="text-sm text-[#0f2f47]/70">{description}</DialogDescription> : null}
      </div>
      <DialogClose asChild>
        <button
          type="button"
          className="rounded-full border border-[#0f2f47]/15 bg-white/80 p-1.5 text-[#0f2f47]/70 transition hover:border-[#0f2f47]/30 hover:text-[#0f2f47] focus:outline-none focus:ring-2 focus:ring-[#0067a0]/40"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogClose>
    </DialogHeader>
  )
}

type KanbanDialogBodyProps = {
  children: ReactNode
  className?: string
}

export function KanbanDialogBody({ children, className }: KanbanDialogBodyProps) {
  return <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-4 text-[#0f2f47]/85", className)}>{children}</div>
}

type KanbanDialogFooterProps = {
  children: ReactNode
  className?: string
}

export function KanbanDialogFooter({ children, className }: KanbanDialogFooterProps) {
  return <div className={cn("flex items-center justify-end gap-3 border-t border-[#0f2f47]/12 px-6 py-4", className)}>{children}</div>
}
