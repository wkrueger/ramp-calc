const mults = [
  { label: "", val: 1 },
  { label: "K", val: 1000 },
  { label: "M", val: 1e6 },
]

export function numberFormat(num: number) {
  for (const mult of mults) {
    let test = num / mult.val
    if (test > 1000) {
      continue
    }
    let fmt = test.toFixed(1) + mult.label
    return fmt.trim()
  }
  const last = mults[mults.length - 1]
  let test = num / last.val
  let out = test.toFixed(1) + last.label
  return out.trim()
}
