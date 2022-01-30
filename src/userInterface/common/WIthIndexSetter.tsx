import { useCallback } from "react"

export type IndexSetter<T> = (index: number, cb: (oldVal: T) => T) => void

export function WithIndexSetter<T, ValueProp extends string, SetterProp extends string>({
  value,
  setter,
  valueProp,
  setterProp,
  index,
  Component,
}: {
  value: T
  setter: IndexSetter<T>
  valueProp: ValueProp
  setterProp: SetterProp
  index: number
  Component: React.FC<{ [v in ValueProp]: T } & { [s in SetterProp]: (cb: (val: T) => any) => any }>
}) {
  const setValue = useCallback(
    (modifier: (v: T) => T) => {
      setter(index, oldVal => {
        const newVal = modifier(oldVal)
        return newVal
      })
    },
    [index, setter]
  )
  const props = { [valueProp]: value, [setterProp]: setValue }
  const C = Component as any
  return <C {...props} />
}
