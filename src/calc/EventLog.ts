import { EventTime } from "./events"

type EventLogListener = (ev: EventTime) => void

export class EventLog {
  log: EventTime[] = []
  listeners: EventLogListener[] = []

  // addListener(listener: EventLogListener) {
  //   this.listeners.push(listener)
  // }

  push(item: EventTime) {
    this.log.push(item)
    for (let listener of this.listeners) {
      listener(item)
    }
  }
}
