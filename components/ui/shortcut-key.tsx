import * as React from "react"
import { Kbd } from "@/components/ui/kbd"
import { useIsMac } from "@/hooks/use-is-mac"
import { cn } from "@/lib/utils"

interface ShortcutKeyProps extends React.ComponentProps<typeof Kbd> {
  keys: string[]
}

export function ShortcutKey({ keys, className, ...props }: Readonly<ShortcutKeyProps>) {
  const isMac = useIsMac()

  const displayKeys = keys.map((k) => {
    const lowerK = k.toLowerCase()
    
    if (lowerK === "meta" || lowerK === "cmd" || lowerK === "command") {
      return isMac ? "⌘" : "Ctrl"
    }
    
    if (lowerK === "backspace" || lowerK === "delete" || lowerK === "del") {
      return isMac ? "⌫" : "Del"
    }

    if (lowerK === "shift") {
      return isMac ? "⇧" : "Shift"
    }

    if (lowerK === "alt") {
      return isMac ? "⌥" : "Alt"
    }

    return k.length === 1 ? k.toUpperCase() : k
  })

  return (
    <Kbd className={cn("ml-2 font-mono text-[10px]", className)} {...props}>
      {displayKeys.join(" ")}
    </Kbd>
  )
}
