export function createEvent(args: { value: any; name: string }) {
  return {
    target: {
      name: args.name,
      value: args.value,
    },
  }
}

export interface BasicEvent<T = any> {
  target: {
    name: string
    value: T
  }
}
