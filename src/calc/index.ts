import { EncounterState } from "./EncounterState"
import { EventLog } from "./EventLog"
import { StatRatingsIn } from "./player"
import { Spells } from "./spellsConstants"

export function reduceEvents(args: { log: EventLog; type: "heal" | "dmg" }) {
  let out = 0
  for (const eventTime of args.log.log) {
    const { event } = eventTime
    if (event.type === args.type) {
      out += event.value || 0
    }
  }
  return out
}

export type CalcResult = ReturnType<typeof getHealing>

export function getHealing(p: { spells: Spells[]; playerStatRatings: StatRatingsIn }) {
  const state = new EncounterState({ playerStatRatings: p.playerStatRatings })
  state.queueSequence("0", p.spells)
  state.run()
  const healing = reduceEvents({ log: state.eventLog, type: "heal" })
  return { healing, time: state.time, log: state.eventLog.log }
}
