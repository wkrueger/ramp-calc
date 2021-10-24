import { EncounterState } from "."
import { auras, Auras } from "./auras"
import { spells, Spells } from "./spells"

export type CombatEvent =
  | { id: number; type: "_queuenext" }
  | {
      id: number
      type: "dmg"
      target: string
      spell?: Spells
      aura?: Auras
      source: string
      value: number | null
      calcValue?: boolean
    }
  | {
      id: number
      type: "heal"
      target: string
      spell: Spells
      source: string
      value: number | null
      calcValue?: boolean
    }
  | {
      id: number
      type: "spell_cast_start"
      target: string | null
      spell: Spells
      source: string
      castEnd: number
    }
  | {
      id: number
      type: "spell_cast_success"
      target: string | null
      spell: Spells
      source: string
    }
  | {
      id: number
      type: "aura_apply"
      aura: Auras
      source: string
      target: string
    }
  | {
      id: number
      type: "aura_remove"
      target: string
      eventReference: number
    }

export interface EventTime {
  time: number
  event: CombatEvent
}

type PickFromUn<Un, T extends string> = Un extends { type: T } ? Un : never

export const handlers: Record<string, (ev: any, en: EncounterState) => any> = {
  spell_cast_start: (
    event: PickFromUn<CombatEvent, "spell_cast_start">,
    encounter: EncounterState
  ) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    caster.combatState.state = {
      type: "casting",
      spell: event.spell,
      start: encounter.time,
      end: event.castEnd,
    }
  },
  spell_cast_success: (
    event: PickFromUn<CombatEvent, "spell_cast_success">,
    encounter: EncounterState
  ) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    caster.combatState.state = {
      type: "idle",
    }
  },
  dmg: (event: PickFromUn<CombatEvent, "dmg">, encounter: EncounterState) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (event.calcValue && event.spell) {
      const spellInfo = spells[event.spell]
      if (!spellInfo) throw Error("Spell not found.")
      if (spellInfo.getDamage) {
        const source = encounter.friendlyUnitsIdx.get(event.source)
        if (!source) throw Error("Source not found.")
        const value = spellInfo.getDamage(source.stats.getStatRatings())
        event.value = value
      }
    }
  },
  aura_apply: (event: PickFromUn<CombatEvent, "aura_apply">, encounter: EncounterState) => {
    const target = encounter.allUnitsIdx.get(event.target)
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!target) {
      throw Error("Target not found.")
    }
    if (!caster) {
      throw Error("Caster not found.")
    }
    const auraInfo = auras[event.aura]
    if (!auraInfo) {
      throw Error("Aura info not found.")
    }
    const auraExpireTime = encounter.time + auraInfo.duration
    target.auras.push({
      id: event.aura,
      appliedAt: encounter.time,
      caster: event.source,
      eventReference: event.id,
      expiredAt: auraExpireTime,
    })
    encounter.scheduledEvents.push({
      time: auraExpireTime,
      event: {
        id: encounter.createEventId(),
        type: "aura_remove",
        eventReference: event.id,
        target: target.id,
      },
    })
    if (auraInfo.dot) {
      const hastePct = 1 + caster.stats.getHastePct()
      const damage = auraInfo.dot.getDoTDamage(caster.stats.getStatRatings()) * hastePct
      const interval = auraInfo.dot.interval / hastePct
      const nticks = auraInfo.duration / interval
      const dmgPerTick = damage / nticks
      const restTickDmg = dmgPerTick * (nticks % 1)
      const fullTicks = Math.floor(nticks)
      for (let tickIt = 0; tickIt < fullTicks; tickIt++) {
        const tickTime = encounter.time + (tickIt + 1) * interval
        encounter.scheduledEvents.push({
          time: tickTime,
          event: {
            id: encounter.createEventId(),
            type: "dmg",
            source: caster.id,
            aura: event.aura,
            target: target.id,
            value: dmgPerTick,
          },
        })
      }
      encounter.scheduledEvents.push({
        time: auraExpireTime,
        event: {
          id: encounter.createEventId(),
          type: "dmg",
          source: caster.id,
          aura: event.aura,
          target: target.id,
          value: restTickDmg,
        },
      })
    }
  },
  aura_remove: (event: PickFromUn<CombatEvent, "aura_remove">, encounter: EncounterState) => {
    const target = encounter.allUnitsIdx.get(event.target)
    if (!target) {
      throw Error("Target not found")
    }
    const targetAuraIndex = target.auras.findIndex(
      (aura) => aura.eventReference === event.eventReference
    )
    if (targetAuraIndex === -1) {
      throw Error("Target aura not found.")
    }
    target.auras.splice(targetAuraIndex, 1)
  },
}
