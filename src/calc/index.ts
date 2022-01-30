import { Talents } from "../data/talents"
import { Auras } from "./aurasConstants"
import { EncounterState } from "./EncounterState"
import { EventLog } from "./EventLog"
import { Spells } from "./spellsConstants"
import { StatRatingsIn } from "./StatsHandler"

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

export function getEncounterState(p: {
  playerStatRatings: StatRatingsIn
  talents: Talents[]
  conduits: Auras[]
}) {
  const state = new EncounterState({
    playerStatRatings: p.playerStatRatings,
    talents: p.talents,
    conduits: p.conduits,
  })
  return state
}

export function getHealing({
  state,
  spellsQueued,
}: {
  state: EncounterState
  spellsQueued: Spells[]
}) {
  state.queueSequence("0", spellsQueued)
  state.run()
  const healing = reduceEvents({ log: state.eventLog, type: "heal" })
  return {
    healing,
    time: state.time,
    log: state.eventLog.log,
  }
}
