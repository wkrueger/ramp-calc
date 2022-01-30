import { useState, useEffect, useRef } from "react"

// Hook
export function useWhyDidYouUpdate(name: string, props: Record<string, any>) {
  const previousProps = useRef<any>()

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changesObj: any = {}
      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          }
        }
      })

      // If changesObj not empty then output to console
      if (Object.keys(changesObj).length) {
        // eslint-disable-next-line no-console
        console.log("[why-did-you-update]", name, changesObj)
      }
    }

    // Finally update previousProps with current props for next hook call
    previousProps.current = props
  })
}
