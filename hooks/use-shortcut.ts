import { useEffect } from "react"

export function useShortcut(keys: string[], callback: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if the user is typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return
      }

      // Check if the pressed key is in our array (case-insensitive for characters like 'delete' vs 'Delete')
      const match = keys.some(key => e.key.toLowerCase() === key.toLowerCase())

      if (match) {
        e.preventDefault()
        callback()
      }
    }

    globalThis.addEventListener("keydown", handleKeyDown)
    return () => globalThis.removeEventListener("keydown", handleKeyDown)
  }, [keys, callback, enabled])
}
