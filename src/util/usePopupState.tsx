import { useCallback, useRef, useState } from "react"

const TIMEOUT = 500

export function usePopupState() {
  const [isOpen, setOpen] = useState(false)
  const lastClosed = useRef(0)
  const handleSetOpen = useCallback((state: boolean) => {
    const now = new Date()
    const elapsed = now.getTime() - lastClosed.current || 0
    if (elapsed < TIMEOUT && state) return
    if (!state) lastClosed.current = now.getTime()
    setOpen(state)
  }, [])
  return [isOpen, handleSetOpen] as const
}
