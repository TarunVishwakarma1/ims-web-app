import { useState, useEffect } from "react"

export function useIsMac() {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent))
  }, [])

  return isMac
}
