"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import DOMPurify from "dompurify"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  IndentIncrease,
  IndentDecrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Underline,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
}

type ToolbarButton = {
  icon: LucideIcon
  label: string
  command:
    | "bold"
    | "italic"
    | "underline"
    | "insertUnorderedList"
    | "insertOrderedList"
    | "createLink"
    | "removeFormat"
    | "justifyLeft"
    | "justifyCenter"
    | "justifyRight"
    | "justifyFull"
    | "indent"
    | "outdent"
  needsValue?: boolean
}

type FontSizeControl = "small" | "reset" | "large"
type ColorOption = {
  label: string
  value: string
}

const FONT_SIZE_CONTROLS: { key: FontSizeControl; label: string; description: string }[] = [
  { key: "small", label: "A-", description: "Diminuir fonte" },
  { key: "reset", label: "A", description: "Fonte padrão" },
  { key: "large", label: "A+", description: "Aumentar fonte" },
]

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { icon: Bold, label: "Negrito", command: "bold" },
  { icon: Italic, label: "Itálico", command: "italic" },
  { icon: Underline, label: "Sublinhado", command: "underline" },
  { icon: List, label: "Lista", command: "insertUnorderedList" },
  { icon: ListOrdered, label: "Lista numerada", command: "insertOrderedList" },
  { icon: AlignLeft, label: "Alinhar à esquerda", command: "justifyLeft" },
  { icon: AlignCenter, label: "Centralizar", command: "justifyCenter" },
  { icon: AlignRight, label: "Alinhar à direita", command: "justifyRight" },
  { icon: AlignJustify, label: "Justificar", command: "justifyFull" },
  { icon: IndentIncrease, label: "Aumentar recuo", command: "indent" },
  { icon: IndentDecrease, label: "Diminuir recuo", command: "outdent" },
  { icon: Link2, label: "Inserir link", command: "createLink", needsValue: true },
  { icon: Eraser, label: "Limpar formatação", command: "removeFormat" },
]

const FONT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Padrão", value: "#1f2937" },
  { label: "Rosa", value: "#be123c" },
  { label: "Âmbar", value: "#b45309" },
  { label: "Azul", value: "#1d4ed8" },
  { label: "Verde", value: "#15803d" },
]

const HIGHLIGHT_COLOR_OPTIONS: ColorOption[] = [
  { label: "Limpar", value: "transparent" },
  { label: "Amarelo", value: "#fef08a" },
  { label: "Rosa", value: "#fbcfe8" },
  { label: "Azul", value: "#bae6fd" },
  { label: "Verde", value: "#d9f99d" },
]

export function RichTextEditor({ value, onChange, placeholder, className, ariaLabel }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const hasContent = useMemo(() => extractPlainText(value).length > 0, [value])

  useEffect(() => {
    if (!editorRef.current) return
    if (editorRef.current.innerHTML === value) return
    editorRef.current.innerHTML = value || ""
  }, [value])

  const handleInput = () => {
    if (!editorRef.current) return
    const rawHtml = editorRef.current.innerHTML
    const sanitized = DOMPurify.sanitize(rawHtml, { USE_PROFILES: { html: true } })
    onChange(sanitized)
  }

  const runCommand = (command: ToolbarButton["command"], needsValue?: boolean) => {
    if (typeof document === "undefined") return

    if (needsValue) {
      const url = typeof window !== "undefined" ? window.prompt("Informe o endereço do link") : null
      if (!url) return
      document.execCommand(command, false, url)
    } else {
      document.execCommand(command, false)
    }

    editorRef.current?.focus()
    handleInput()
  }

  const applyFontColor = (color: string) => {
    if (typeof document === "undefined") return
    document.execCommand("foreColor", false, color)
    editorRef.current?.focus()
    handleInput()
  }

  const applyHighlightColor = (color: string) => {
    if (typeof document === "undefined") return
    document.execCommand("hiliteColor", false, color)
    editorRef.current?.focus()
    handleInput()
  }

  const wrapSelectionWithFontSize = (size: "small" | "large") => {
    if (typeof window === "undefined" || !editorRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)
    if (range.collapsed || !editorRef.current.contains(range.commonAncestorContainer)) return

    const span = document.createElement("span")
    span.setAttribute("data-td-font", size)
    span.appendChild(range.extractContents())
    range.insertNode(span)

    selection.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(span)
    selection.addRange(newRange)

    handleInput()
  }

  const findFontSpanAncestor = (node: Node | null): HTMLElement | null => {
    let current: Node | null = node
    while (current && current !== editorRef.current) {
      if (current instanceof HTMLElement && current.dataset.tdFont) {
        return current
      }
      current = current.parentNode
    }
    return null
  }

  const unwrapFontSpan = (span: HTMLElement) => {
    while (span.firstChild) {
      span.parentNode?.insertBefore(span.firstChild, span)
    }
    span.remove()
  }

  const clearFontSize = () => {
    if (typeof window === "undefined" || !editorRef.current) return
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    const range = selection.getRangeAt(0)

    if (range.collapsed) {
      const span = findFontSpanAncestor(selection.anchorNode)
      if (span) {
        unwrapFontSpan(span)
        handleInput()
      }
      return
    }

    const spans = Array.from(editorRef.current.querySelectorAll<HTMLElement>("span[data-td-font]"))
    spans.forEach((span) => {
      if (range.intersectsNode(span)) {
        unwrapFontSpan(span)
      }
    })
    handleInput()
  }

  const handleFontSizeControl = (control: FontSizeControl) => {
    if (control === "reset") {
      clearFontSize()
    } else {
      wrapSelectionWithFontSize(control)
    }
    editorRef.current?.focus()
  }

  const placeholderVisible = !hasContent && !isFocused

  return (
    <div className={cn("rounded-2xl border border-zinc-200 bg-white/80", className)}>
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-100 px-3 py-2 text-zinc-500">
        {TOOLBAR_BUTTONS.map((button) => (
          <button
            key={button.command}
            type="button"
            aria-label={button.label}
            onClick={() => runCommand(button.command, button.needsValue)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
          >
            <button.icon className="h-4 w-4" />
          </button>
        ))}

        <div className="flex items-center gap-2">
          <select
            defaultValue=""
            aria-label="Cor da fonte"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const color = event.target.value
              if (!color) return
              applyFontColor(color)
              event.target.value = ""
            }}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-400 focus:outline-none"
          >
            <option value="" disabled>
              Cor texto
            </option>
            {FONT_COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            defaultValue=""
            aria-label="Cor de destaque"
            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
              const color = event.target.value
              if (!color) return
              applyHighlightColor(color)
              event.target.value = ""
            }}
            className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-400 focus:outline-none"
          >
            <option value="" disabled>
              Marca-texto
            </option>
            {HIGHLIGHT_COLOR_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {FONT_SIZE_CONTROLS.map((control) => (
            <button
              key={control.key}
              type="button"
              aria-label={control.description}
              onClick={() => handleFontSizeControl(control.key)}
              className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-full border border-zinc-200 px-2 text-[11px] font-semibold text-zinc-600 transition hover:border-zinc-400 hover:text-zinc-900"
            >
              {control.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative">
        {placeholder && placeholderVisible ? (
          <span className="pointer-events-none absolute left-4 top-3 text-sm text-zinc-400">{placeholder}</span>
        ) : null}
        <div
          ref={editorRef}
          role="textbox"
          aria-multiline
          aria-label={ariaLabel}
          contentEditable
          suppressContentEditableWarning
          className="min-h-[160px] w-full rounded-b-2xl px-4 py-3 text-sm leading-relaxed text-zinc-800 focus:outline-none"
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false)
            handleInput()
          }}
        />
      </div>
    </div>
  )
}

function extractPlainText(html: string) {
  if (!html) return ""
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, "").trim()
  }
  const temp = document.createElement("div")
  temp.innerHTML = html
  return temp.textContent?.trim() ?? ""
}
