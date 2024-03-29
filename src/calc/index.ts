import { Talents } from "../data/talents"
import { Auras } from "./constants/aurasConstants"
import { EncounterState } from "./core/EncounterState"
import { EventLog } from "./core/EventLog"
import { Spells } from "./constants/spellsConstants"
import { StatRatingsIn } from "./core/StatsHandler"
import { CritMode } from "./constants/enums"
export * from "./core/StatsHandler"

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
  legendaries: Auras[]
  hasTierSet: boolean
}) {
  const otherAuras: Auras[] = []
  if (p.hasTierSet) {
    otherAuras.push(Auras.TilDawn)
  }
  otherAuras.push(...p.legendaries)
  const state = new EncounterState({
    playerStatRatings: p.playerStatRatings,
    talents: p.talents,
    conduits: p.conduits,
    critMode: CritMode.Average,
    otherAuras,
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
