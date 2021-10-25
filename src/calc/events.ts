import { EncounterState } from "."
import { Aura, auras, Auras } from "./auras"
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
      sourceEvent?: number //atonement tracking
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
      auraModifiers?: {
        durationPct?: number // radiance
      }
    }
  | {
      id: number
      type: "aura_remove"
      aura: Auras
      target: string
      eventReference: number
    }

export interface EventTime {
  time: number
  event: CombatEvent
}

export type PickFromUn<Un, T extends string> = Un extends { type: T } ? Un : never

export const handlers: Record<string, (ev: any, en: EncounterState) => any> = {
  spell_cast_start: (
    event: PickFromUn<CombatEvent, "spell_cast_start">,
    encounter: EncounterState
  ) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (!caster.canCastSpell({ time: encounter.time, spell: event.spell })) {
      throw Error(`Spell ${event.spell} is on recharge.`)
    }
  },
  spell_cast_success: (
    event: PickFromUn<CombatEvent, "spell_cast_success">,
    encounter: EncounterState
  ) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    const spellInfo = spells[event.spell]
    if (spellInfo.allowed) {
      const isAllowed = spellInfo.allowed(caster)
      if (!isAllowed) throw Error(`Spell ${event.spell} not allowed now.`)
    }
    if (!spellInfo.cast) {
      if (!caster.canCastSpell({ time: encounter.time, spell: spellInfo.id })) {
        throw Error(`Spell ${spellInfo.id} on recharge.`)
      }
      const computedCast = (spellInfo.gcd || 1.5) / (1 + caster.stats.getHastePct())
      const gcdEnd = encounter.time + computedCast
      const recharge = (spellInfo.cooldown || 0) / (1 + caster.stats.getHastePct())
      const rechargeMax = Math.max(gcdEnd, recharge)
      caster.setSpellRecharge(spellInfo.id, rechargeMax)
    }
    if (spellInfo.onEffect) {
      spellInfo.onEffect(event, encounter, caster)
    }
  },
  dmg: (event: PickFromUn<CombatEvent, "dmg">, encounter: EncounterState) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (event.calcValue && event.spell) {
      const target = encounter.enemyUnitsIdx.get(event.target)!
      let multiplier = 1
      if (target.getAura(Auras.Schism) && !event.source.startsWith("pet")) {
        multiplier = 1.25
      }
      const spellInfo = spells[event.spell]
      if (!spellInfo) throw Error("Spell not found.")
      if (spellInfo.getDamage) {
        const value = spellInfo.getDamage(caster.stats.getStatRatings(), caster) * multiplier
        event.value = value
      }
    }
    // atonement
    for (const unit of encounter.friendlyUnitsIdx.values()) {
      const hasAtonement = unit.auras.some(
        (aura) => aura.id === Auras.Atonement && aura.caster === caster.id
      )
      if (hasAtonement) {
        const healValue = (event.value || 0) * caster.stats.getMasteryPct()
        encounter.scheduledEvents.push({
          time: encounter.time,
          event: {
            type: "heal",
            id: encounter.createEventId(),
            source: caster.id,
            spell: Spells.Atonement,
            target: unit.id,
            value: healValue,
            sourceEvent: event.id,
          },
        })
      }
    }
  },
  heal: (event: PickFromUn<CombatEvent, "heal">, encounter: EncounterState) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (event.calcValue && event.spell) {
      const spellInfo = spells[event.spell]
      if (!spellInfo) throw Error("Spell not found.")
      if (spellInfo.getHealing) {
        const value = spellInfo.getHealing(caster.stats.getStatRatings())
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
    const durationModifier = event.auraModifiers?.durationPct ?? 1
    const auraExpireTime = encounter.time + auraInfo.duration * durationModifier
    const link = encounter.scheduledEvents.push({
      time: auraExpireTime,
      event: {
        id: encounter.createEventId(),
        type: "aura_remove",
        eventReference: event.id,
        target: target.id,
        aura: event.aura,
      },
    })
    const aura: Aura = {
      id: event.aura,
      appliedAt: encounter.time,
      caster: event.source,
      eventReference: event.id,
      expiredAt: auraExpireTime,
      links: [link],
    }
    target.auras.push(aura)
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
        const link = encounter.scheduledEvents.push({
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
        aura.links.push(link)
      }
      const link = encounter.scheduledEvents.push({
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
      aura.links.push(link)
    }
  },
  aura_remove: (event: PickFromUn<CombatEvent, "aura_remove">, encounter: EncounterState) => {
    const target = encounter.allUnitsIdx.get(event.target)
    if (!target) {
      throw Error("Target not found")
    }
    const auraInfo = auras[event.aura]
    if (!auraInfo) {
      throw Error("Aura not found.")
    }
    if (auraInfo.onExpire) {
      auraInfo.onExpire(event, encounter)
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
