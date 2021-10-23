import { CombatEvent } from "./events"

interface Link {
  value: {
    event: CombatEvent
    time: number
  }
  next: Link | null
  prev: Link | null
}

// poor man sorted linked list
export class ScheduledEvents {
  private headLink: Link | null = null
  private tailLink: Link | null = null

  push(obj: { event: CombatEvent; time: number }) {
    const { time } = obj
    if (!this.tailLink) {
      const newLink: Link = { value: obj, next: null, prev: null }
      this.headLink = newLink
      this.tailLink = newLink
      return
    }
    let current = this.tailLink
    while (true) {
      if (time < current.value.time) {
        if (!current.prev) {
          // start of chain
          const newLink: Link = { value: obj, next: current, prev: null }
          current.prev = newLink
          this.headLink = newLink
          return
        }
        current = current.prev
      } else {
        // greater than or equal
        if (!current.next) {
          // end of chain
          const newLink: Link = { value: obj, next: null, prev: current }
          current.next = newLink
          this.tailLink = current
          return
        } else {
          // insert in middle
          const newLink: Link = { value: obj, next: current.next, prev: current }
          current.next = newLink
          return
        }
      }
    }
  }

  shift() {
    const out = this.headLink
    if (out) {
      this.headLink = out.next
      if (this.headLink) {
        this.headLink.prev = null
      } else {
        this.tailLink = null
      }
      return out.value
    } else {
      return null
    }
  }

  all() {
    const out: Link["value"][] = []
    let current = this.headLink
    while (current) {
      out.push(current.value)
      current = current.next
    }
    return out
  }
}
