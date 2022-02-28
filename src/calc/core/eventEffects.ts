import { Aura, auras } from "../priest/auras"
import { Auras, DURATION_INFINITE } from "../constants/aurasConstants"
import type { EncounterState } from "./EncounterState"
import { Player } from "./Player"
import { CritBehavior, getSpellInfo, VersBehavior } from "../priest/spells"
import type { Spell } from "../priest/spells"
import { Spells } from "../constants/spellsConstants"
import { CritMode } from "../constants/enums"

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
      tickNumber?: number
      totalTicks?: number
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
      tickNumber?: number
      totalTicks?: number
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
      spell: Spells | null
      // auraModifiers?: {
      //   durationPct?: number // radiance
      //   durationSec?: number
      //   tickPct?: number
      // }
    }
  | {
      id: number
      type: "aura_remove"
      aura: Auras
      source: string
      target: string
    }
  | {
      id: number
      type: "aura_sum_stacks"
      aura: Auras
      source: string
      target: string
      quantity: number
    }

export interface EventTime {
  time: number
  event: CombatEvent
}

export type PickFromUn<Un, T extends string> = Un extends { type: T } ? Un : never

function getCritVers({
  spell,
  caster,
  critMode,
}: {
  spell: Spell
  caster: Player
  critMode: CritMode
}) {
  let crit = 1
  if ((spell.critBehavior || CritBehavior.Default) === CritBehavior.Default) {
    if (critMode === CritMode.Average) {
      crit = 1 + caster.stats.getCriticalPct()
    } else if (critMode === CritMode.Random) {
      const ratio = caster.stats.getCriticalPct()
      const roll = ratio - Math.random() <= 0
      crit = roll ? 2 : 1
    }
  } else if (spell.critBehavior === CritBehavior.Never) {
    crit = 1
  } else if (spell.critBehavior === CritBehavior.Always) {
    crit = 2
  }
  let vers = 1
  if ((spell.versBehavior || VersBehavior.Default) === VersBehavior.Default) {
    vers = 1 + caster.stats.getVersatilityPct()
  } else if (spell.versBehavior === VersBehavior.Disable) {
    vers = 1
  }
  return { crit, vers }
}

function composeDamageMultiplier({
  spell,
  caster,
  critMode,
}: {
  spell: Spell
  caster: Player
  critMode: CritMode
}) {
  const { crit, vers } = getCritVers({ spell, caster, critMode })
  const casterMultSpell = caster.getDamageMultiplier(spell.id)
  return vers * crit * casterMultSpell
}

function composeHealingMultiplier({
  spell,
  caster,
  critMode,
}: {
  spell: Spell
  caster: Player
  critMode: CritMode
}) {
  const { crit, vers } = getCritVers({ spell, caster, critMode })
  const casterMultSpell = caster.getHealingMultiplier(spell.id)
  return vers * crit * casterMultSpell
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
    const caster = encounter.friendlyUnitsIdx.get(event.source)!
    const spellInfo = getSpellInfo(event.spell, caster)
    if (spellInfo.onCastSuccess) {
      spellInfo.onCastSuccess(event as any, encounter, caster)
    }
    return eventEffects.spell_cast_start(event, encounter)
  },
  spell_cast_success: (
    event: PickFromUn<CombatEvent, "spell_cast_success">,
    encounter: EncounterState
  ) => {
    const caster = encounter.friendlyUnitsIdx.get(event.source)
    if (!caster) throw Error("Caster not found.")
    const spellInfo = getSpellInfo(event.spell, caster)
    const isAllowed = caster.spellIsAllowed(spellInfo)
    if (!isAllowed) throw Error(`Spell ${event.spell} not allowed now.`)
    {
      const gcdEnd = spellInfo.cast
        ? encounter.time
        : encounter.time + (spellInfo.gcd || 1.5) / (1 + caster.stats.getHastePct())
      const recharge = spellInfo.cooldown || 0
      const rechargeMax = Math.max(gcdEnd, recharge)
      caster.setSpellRecharge(spellInfo, rechargeMax)
    }
    // if channelled, occurs on cast start
    if (spellInfo.onCastSuccess && !spellInfo.channel) {
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
      const spellInfo = getSpellInfo(event.spell, caster)
      if (!spellInfo) throw Error(`Spell ${event.spell} not found.`)
      const composedMult = composeDamageMultiplier({
        caster,
        spell: spellInfo,
        critMode: encounter.critMode,
      })
      if (spellInfo.getDamage) {
        const value =
          spellInfo.getDamage(caster.stats.getStatRatings(), caster, event) * composedMult
        event.value = value
      } else if (event.value) {
        event.value = event.value * composedMult
      }
    }
    const spellInfo = getSpellInfo(event.spell, caster)
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
    const spellInfo = getSpellInfo(event.spell, caster)
    if (!spellInfo) {
      throw Error(`Spell ${event.spell} not found.`)
    }
    if (event.calcValue) {
      if (spellInfo.getHealing) {
        const value = spellInfo.getHealing(caster.stats.getStatRatings(), caster, event)
        const mult = composeHealingMultiplier({
          spell: spellInfo,
          caster,
          critMode: encounter.critMode,
        })
        event.value = value * mult
      }
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
    const spellInfo = event.spell ? getSpellInfo(event.spell, caster) : null
    if (event.source === caster.id) {
      caster.onEvent(event)
    }
    const durationModifier = spellInfo?.auraModifiers?.durationPct ?? 1
    const durationModSec = spellInfo?.auraModifiers?.durationSec || 0
    if (auraInfo.duration === DURATION_INFINITE) {
      const alreadyHasAura = target.getAura(event.aura)
      if (!alreadyHasAura) {
        target.addAura({
          id: auraInfo.id,
          caster: event.source,
          appliedAt: encounter.time,
          eventReference: event.id,
          expiredAt: Infinity,
          links: [],
        })
      }
    } else if (typeof auraInfo.duration === "number") {
      const alreadyHasAura = target.getAura(event.aura)
      const auraExpireTime = encounter.time + auraInfo.duration * durationModifier + durationModSec
      if (alreadyHasAura) {
        const aura = alreadyHasAura
        if (auraInfo.stackable) {
          aura.stacks = (aura.stacks || 1) + 1
        }
        // reposition expire event
        const expireLinkIndex = aura.links.findIndex(x => x.value.event.type === "aura_remove")
        if (expireLinkIndex) throw Error("Expire link not found.")
        const [expireLink] = aura.links.splice(expireLinkIndex, 1)
        encounter.scheduledEvents.removeByLink(expireLink)
        expireLink.value.time = auraExpireTime
        const newLink = encounter.scheduledEvents.push(expireLink.value)
        aura.links.push(newLink)
        // FIXME PANDEMIC (reposition dot events)
        return
      }
      const link = encounter.scheduledEvents.push({
        time: auraExpireTime,
        event: {
          id: encounter.createEventId(),
          type: "aura_remove",
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
        const tickMult = spellInfo?.auraModifiers?.tickPct || 1
        const hastePct = (1 + caster.stats.getHastePct()) * tickMult
        const dotSpell = getSpellInfo(auraInfo.dot.spell, caster)
        if (!dotSpell) throw Error(`Spell ${dotSpell} not found (auraInfo.dot).`)
        const composedMult = composeDamageMultiplier({
          caster,
          spell: dotSpell,
          critMode: encounter.critMode,
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
    const aura = target.getAura(auraInfo.id)
    if (!aura) return
    // an extra aura_remove can be invoked prematurely (ex: dispel, consume aura)
    // in that case, remove all of the scheduled ticks etc.
    for (const link of aura.links) {
      encounter.scheduledEvents.removeByLink(link)
    }
    target.removeAura(auraInfo.id)
  },
  aura_sum_stacks: (
    event: PickFromUn<CombatEvent, "aura_sum_stacks">,
    encounter: EncounterState
  ) => {
    const { aura: auraId, target: hostId, quantity } = event
    const host = encounter.allUnitsIdx.get(hostId)!
    const aura = host.getAura(auraId)
    if (!aura) return
    aura.stacks = Math.max((aura.stacks || 1) + quantity, 0)
    if (aura.stacks <= 0) {
      encounter.scheduledEvents.push({
        time: encounter.time,
        event: {
          id: encounter.createEventId(),
          type: "aura_remove",
          aura: auraId,
          source: event.source,
          target: event.target,
        },
      })
    }
  },
}
