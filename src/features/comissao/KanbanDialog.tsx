"use client"

import type { ReactNode } from "react"

import { DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const sizeClasses = {
  narrow: "max-w-lg",
  medium: "max-w-3xl",
  large: "max-w-4xl",
  wide: "max-w-5xl",
}

type KanbanDialogContentProps = {
  children: ReactNode
  size?: keyof typeof sizeClasses
  className?: string
}

export function KanbanDialogContent({ children, size = "medium", className }: KanbanDialogContentProps) {
  return (
    <DialogContent className={cn("flex max-h-[90vh] w-full flex-col overflow-hidden bg-white p-0 text-zinc-900", sizeClasses[size], className)}>
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
    <DialogHeader className="flex flex-row items-start justify-between gap-3 border-b px-6 py-4">
      <div className="space-y-1">
        <DialogTitle className="text-2xl font-semibold text-zinc-900">{title}</DialogTitle>
        {description ? <DialogDescription className="text-sm text-zinc-500">{description}</DialogDescription> : null}
      </div>
      <DialogClose asChild>
        <button
          type="button"
          className="rounded-full p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-200"
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
  return <div className={cn("flex-1 overflow-y-auto px-6 py-4", "min-h-0", className)}>{children}</div>
}

type KanbanDialogFooterProps = {
  children: ReactNode
  className?: string
}

export function KanbanDialogFooter({ children, className }: KanbanDialogFooterProps) {
  return <div className={cn("flex items-center justify-end gap-3 border-t px-6 py-4", className)}>{children}</div>
}
