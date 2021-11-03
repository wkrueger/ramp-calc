import { useCallback } from "react"

export function WithIndexSetter<T, Val extends string, Setter extends string>({
  value,
  setter,
  valueKey,
  setterKey,
  index,
  Component,
}: {
  value: T
  setter: (val: T, idx: number) => any
  valueKey: Val
  setterKey: Setter
  index: number
  Component: React.FC<{ [v in Val]: T } & { [s in Setter]: (cb: (val: T) => any) => any }>
}) {
  const setValue = useCallback(
    (modifier: (v: T) => T) => {
      const newVal = modifier(value)
      setter(newVal, index)
    },
    [index, setter, value]
  )
  const props = { [valueKey]: value, [setterKey]: setValue }
  const C = Component as any
  return <C {...props} />
}
