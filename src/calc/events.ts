import { Aura, auras } from "./auras"
import { Auras } from "./aurasConstants"
import type { EncounterState } from "./EncounterState"
import { Player } from "./Player"
import { spells } from "./spells"
import { Spells } from "./spellsConstants"

export type CombatEvent =
  | { id: number; type: "_queuenext" }
  | {
      id: number
      type: "dmg"
      target: string
      spell: Spells
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
      type: "spell_channel_start"
      target: string | null
      spell: Spells
      source: string
      castEnd: number
    }
  | {
      id: number
      type: "spell_channel_finish"
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
      source: string
      target: string
      eventReference: number
    }

export interface EventTime {
  time: number
  event: CombatEvent
}

export type PickFromUn<Un, T extends string> = Un extends { type: T } ? Un : never

function composeDamageMultiplier({ spell, caster }: { spell: Spells; caster: Player }) {
  const casterMultSpell = caster.getDamageMultiplier(spell)

  return (1 + caster.stats.getVersatilityPct()) * casterMultSpell
}

export const eventEffects: Record<string, (ev: any, en: EncounterState) => any> = {
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
  spell_channel_start: (
    event: PickFromUn<CombatEvent, "spell_channel_start">,
    encounter: EncounterState
  ) => {
    return eventEffects.spell_cast_start(event, encounter)
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
    if (spellInfo.onCastSuccess) {
      spellInfo.onCastSuccess(event, encounter, caster)
    }
  },
  spell_channel_finish: (
    event: PickFromUn<CombatEvent, "spell_channel_finish">,
    encounter: EncounterState
  ) => {
    return eventEffects.spell_cast_success(event, encounter)
  },
  dmg: (event: PickFromUn<CombatEvent, "dmg">, encounter: EncounterState) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (event.calcValue && event.spell) {
      const spellInfo = spells[event.spell]
      if (!spellInfo) throw Error(`Spell ${event.spell} not found.`)
      const composedMult = composeDamageMultiplier({ caster, spell: event.spell })
      if (spellInfo.getDamage) {
        const value = spellInfo.getDamage(caster.stats.getStatRatings(), caster) * composedMult
        // * (1 + caster.stats.getCriticalPct())
        event.value = value
      } else if (event.value) {
        event.value = event.value * composedMult
      }
    }
    const spellInfo = spells[event.spell]
    if (!spellInfo) throw Error("Spell not found.")
    if (spellInfo.onDamage && spellInfo.onDamage.length) {
      spellInfo.onDamage.forEach(handler => {
        handler.trigger({ caster, event, encounter })
      })
    }
  },
  heal: (event: PickFromUn<CombatEvent, "heal">, encounter: EncounterState) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    if (event.calcValue && event.spell) {
      const spellInfo = spells[event.spell]
      if (!spellInfo) throw Error("Spell not found.")
      if (spellInfo.getHealing) {
        const value = spellInfo.getHealing(caster.stats.getStatRatings(), caster)
        event.value = value
      }
    }
    const applyShell =
      [Spells.PenanceFriendly, Spells.Radiance].includes(event.spell) &&
      Boolean(caster.getAura(Auras.SpiritShellModifier))
    if (applyShell && event.value) {
      event.value = event.value * 0.8
      event.spell = Spells.SpiritShellHeal
    }
    const spellInfo = spells[event.spell]
    if (!spellInfo) {
      throw Error(`Spell ${event.spell} not found.`)
    }
    if (spellInfo.onHeal && spellInfo.onHeal.length) {
      spellInfo.onHeal.forEach(handler => {
        handler.trigger({ caster, event, encounter })
      })
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
      throw Error(`Aura info not found for ${event.aura}.`)
    }
    if (event.source === caster.id) {
      caster.onEvent(event)
    }
    const durationModifier = event.auraModifiers?.durationPct ?? 1
    if (typeof auraInfo.duration === "number") {
      const auraExpireTime = encounter.time + auraInfo.duration * durationModifier
      const link = encounter.scheduledEvents.push({
        time: auraExpireTime,
        event: {
          id: encounter.createEventId(),
          type: "aura_remove",
          eventReference: event.id,
          source: caster.id,
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
      target.addAura(aura)
      if (auraInfo.dot) {
        const hastePct = 1 + caster.stats.getHastePct()
        const composedMult = composeDamageMultiplier({
          caster,
          spell: auraInfo.dot.spell,
        })
        const damage =
          auraInfo.dot.getDoTDamage(caster.stats.getStatRatings(), auraInfo) *
          hastePct *
          composedMult
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
              spell: auraInfo.dot.spell,
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
            spell: auraInfo.dot.spell,
            target: target.id,
            value: restTickDmg,
          },
        })
        aura.links.push(link)
      }
    }
  },
  aura_remove: (event: PickFromUn<CombatEvent, "aura_remove">, encounter: EncounterState) => {
    const target = encounter.allUnitsIdx.get(event.target)
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!target) {
      throw Error("Target not found")
    }
    const auraInfo = auras[event.aura]
    if (!auraInfo) {
      throw Error("Aura not found.")
    }
    if (caster && event.source === caster.id) {
      caster.onEvent(event)
    }
    if (auraInfo.onExpire) {
      auraInfo.onExpire(event, encounter)
    }
    target.removeAura({ eventReference: event.eventReference })
  },
}
