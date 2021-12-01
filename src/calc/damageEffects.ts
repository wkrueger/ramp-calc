import type { EncounterState } from "./EncounterState"
import { Auras } from "./aurasConstants"
import type { CombatEvent, PickFromUn } from "./events"
import { Player } from "./Player"
import type { Spell } from "./spells"
import { Spells } from "./spellsConstants"
import { Talents } from "../data/talents"

interface DamageEventContext {
  caster: Player
  encounter: EncounterState
  event: PickFromUn<CombatEvent, "dmg">
}

interface HealEventContext {
  caster: Player
  encounter: EncounterState
  event: PickFromUn<CombatEvent, "heal">
}

export class DamageEffect {
  trigger: (x: DamageEventContext) => void
  name: string

  constructor(args: { name: string; trigger: (x: DamageEventContext) => void }) {
    this.trigger = args.trigger
    this.name = args.name
  }
}

export class HealEffect {
  trigger: (x: HealEventContext) => void
  name: string

  constructor(args: { name: string; trigger: (x: HealEventContext) => void }) {
    this.trigger = args.trigger
    this.name = args.name
  }
}

export const triggerAtonement = new DamageEffect({
  name: "triggerAtonement",
  trigger({ caster, encounter, event }) {
    const hasShell = Boolean(caster.getAura(Auras.SpiritShellModifier))
    for (const unit of encounter.friendlyUnitsIdx.values()) {
      const hasAtonement = unit.getAura(Auras.Atonement, { caster: caster.id })
      if (hasAtonement) {
        const healValue = (event.value || 0) * caster.stats.getMasteryPct()
        const [spell, heal2] = hasShell
          ? [Spells.SpiritShellHeal, healValue * 0.8]
          : [Spells.Atonement, healValue]
        encounter.scheduledEvents.push({
          time: encounter.time,
          event: {
            type: "heal",
            id: encounter.createEventId(),
            source: caster.id,
            spell,
            target: unit.id,
            value: heal2,
            sourceEvent: event.id,
          },
        })
      }
    }
  },
})

export function triggerHealAsDamagePct({ k, spell }: { k: number; spell: Spell }) {
  return new DamageEffect({
    name: "heal-damage-pct",
    trigger({ caster, encounter, event }) {
      const targets = encounter.getSpellTarget(spell, caster.id)
      for (const target of targets) {
        encounter.scheduledEvents.push({
          time: encounter.time,
          event: {
            type: "heal",
            id: encounter.createEventId(),
            source: caster.id,
            spell: spell.id,
            target: target!.id,
            value: (event.value || 0) * k,
            sourceEvent: event.id,
          },
        })
      }
    },
  })
}

export const triggerContrition = new HealEffect({
  name: "triggerContrition",
  trigger({ caster, encounter, event }) {
    if (!caster.getTalent(Talents.Contrition)) return
    for (const unit of encounter.friendlyUnitsIdx.values()) {
      const hasAtonement = unit.getAura(Auras.Atonement, { caster: caster.id })
      if (hasAtonement) {
        const spell = Spells.Contrition
        encounter.scheduledEvents.push({
          time: encounter.time,
          event: {
            type: "heal",
            id: encounter.createEventId(),
            source: caster.id,
            spell,
            target: unit.id,
            calcValue: true,
            value: null,
            sourceEvent: event.id,
          },
        })
      }
    }
  },
})
