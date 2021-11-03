import type { NextPage } from "next"
import { useCallback, useEffect, useState } from "react"
import { sample } from "../calc"

const Scratch: NextPage = () => {
  const [state, setState] = useState(null as any)
  const [err, setErr] = useState(null as any)
  const run = useCallback(() => {
    try {
      const result = sample()
      setState(result.eventLog.log)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    run()
  }, [run])

  return (
    <>
      <h1>Ramp calc</h1>
      <button type="button" onClick={run}>
        RUN
      </button>
      {state && (
        <>
          <h2>Log</h2>
          <pre>{JSON.stringify(state, null, 2)}</pre>
        </>
      )}
    </>
  )
}

export default Scratch
