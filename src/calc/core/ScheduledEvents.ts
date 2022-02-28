import { CombatEvent, EventTime } from "./eventEffects"

export interface Link {
  value: {
    event: CombatEvent
    time: number
  }
  next: Link | null
  prev: Link | null
  _removed?: boolean
}

// poor man sorted linked list
export class ScheduledEvents {
  private headLink: Link | null = null
  private tailLink: Link | null = null

  compare(a: EventTime, b: EventTime) {
    if (a.time < b.time) return -1
    if (a.time > b.time) return 1
    if (a.event.type === "_queuenext" && b.event.type !== "_queuenext") return 1
    if (b.event.type === "_queuenext" && a.event.type !== "_queuenext") return -1
    return 0
  }

  push(obj: { event: CombatEvent; time: number }) {
    if (!this.tailLink) {
      const newLink: Link = { value: obj, next: null, prev: null }
      this.headLink = newLink
      this.tailLink = newLink
      return newLink
    }
    let current = this.tailLink
    while (true) {
      if (this.compare(obj, current.value) < 0 /*time < current.value.time*/) {
        if (!current.prev) {
          // start of chain
          const newLink: Link = { value: obj, next: current, prev: null }
          current.prev = newLink
          this.headLink = newLink
          return newLink
        }
        current = current.prev
      } else {
        // greater than or equal
        if (!current.next) {
          // end of chain
          const newLink: Link = { value: obj, next: null, prev: current }
          current.next = newLink
          this.tailLink = newLink
          return newLink
        } else {
          // insert in middle
          const newLink: Link = { value: obj, next: current.next, prev: current }
          const oldNext = current.next
          oldNext.prev = newLink
          current.next = newLink
          return newLink
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
      out.next = null
      out.prev = null
      out._removed = true
      return out.value
    } else {
      return null
    }
  }

  removeByLink(link: Link) {
    if (link._removed) return
    const { next, prev } = link
    if (prev) {
      prev.next = next || null
      if (!prev.next) {
        this.tailLink = prev
      }
    }
    if (next) {
      next.prev = prev || null
      if (!next.prev) {
        this.headLink = next
      }
    }
    link.next = null
    link.prev = null
    link._removed = true
  }

  all() {
    let prev: any
    const out: Link["value"][] = []
    let current = this.headLink
    while (current) {
      if (prev && prev.value.time > current.value.time) {
        throw Error("Col not sorted")
      }
      out.push(current.value)
      prev = current
      current = current.next
    }
    return out
  }

  allReverse() {
    let prev: any
    const out: Link["value"][] = []
    let current = this.tailLink
    while (current) {
      if (prev && prev.value.time < current.value.time) {
        throw Error("Col not sorted")
      }
      out.push(current.value)
      prev = current
      current = current.prev
    }
    return out
  }
}
