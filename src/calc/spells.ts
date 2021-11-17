import type { EncounterState } from "."
import { Auras } from "./aurasConstants"
import { DamageEffect, triggerAtonement, triggerHealAsDamagePct } from "./damageEffects"
import type { CombatEvent } from "./events"
import type { Player, StatRatingsIn } from "./player"
import { Spells } from "./spellsConstants"

export enum Targetting {
  Self,
  Enemy,
  Friendly,
  None,
}

export interface Spell {
  id: Spells
  label: string
  cast: number
  icon: string
  channel?: {
    ticks: number
  }
  gcd?: number
  cooldown?: number
  targetting: Targetting
  targetCount?: number
  applyAura?: Auras
  auraModifiers?: {
    durationPct?: number // radiance
  }
  travelTime?: number
  passive?: boolean
  getDamage?: (this: this, stats: StatRatingsIn, player: Player) => number
  getHealing?: (stats: StatRatingsIn, caster: Player) => number
  onEffect?: (event: CombatEvent, es: EncounterState, caster: Player) => void
  onDamage?: Array<DamageEffect> // attaches to damage event, runs after damage calc
  allowed?: (player: Player) => boolean
}

function PriestSpell(spell: Spell): Spell {
  return {
    ...spell,
    onDamage: [...(spell.onDamage || []), triggerAtonement],
  }
}

function getDamage(this: Spell, stats: StatRatingsIn) {
  const found = DbCoefs[this.id]
  if (!found) throw Error(`Coef not set for ${this.id}`)
  return found.db * stats.intellect
}

const Smite = PriestSpell({
  id: Spells.Smite,
  label: "Smite",
  icon: "spell_holy_holysmite",
  targetting: Targetting.Enemy,
  cast: 1.5,
  getDamage,
})

const Pain = PriestSpell({
  id: Spells.Pain,
  label: "Shadow Word: Pain",
  icon: "spell_shadow_shadowwordpain",
  targetting: Targetting.Enemy,
  cast: 0,
  getDamage,
  applyAura: Auras.Pain,
})

const PainDoT = PriestSpell({
  id: Spells.PainDoT,
  label: "Shadow Word: Pain (DoT)",
  icon: "spell_shadow_shadowwordpain",
  passive: true,
  cast: 0,
  targetting: Targetting.Enemy,
})

const PurgeTheWicked = PriestSpell({
  id: Spells.PurgeTheWicked,
  label: "Purge the Wicked",
  icon: "ability_mage_firestarter",
  targetting: Targetting.Enemy,
  cast: 0,
  getDamage,
  applyAura: Auras.PurgeTheWicked,
})

const PurgeTheWickedDoT = PriestSpell({
  id: Spells.PurgeTheWickedDoT,
  label: "Purge the Wicked (DoT)",
  icon: "ability_mage_firestarter",
  targetting: Targetting.Enemy,
  cast: 0,
})

const Shield = PriestSpell({
  id: Spells.Shield,
  label: "Power Word: Shield",
  icon: "spell_holy_powerwordshield",
  targetting: Targetting.Friendly,
  applyAura: Auras.Atonement,
  cast: 0,
  getHealing({ intellect }, caster) {
    const raptureMod = caster.getAura(Auras.Rapture) ? 2 : 1
    return 1.65 * intellect * raptureMod
  },
})

const ShadowMend = PriestSpell({
  id: Spells.ShadowMend,
  label: "Shadow Mend",
  icon: "spell_shadow_shadowmend",
  targetting: Targetting.Friendly,
  applyAura: Auras.Atonement,
  cast: 1.5,
  getHealing({ intellect }) {
    return 3.2 * intellect
  },
})

const Atonement: Spell = {
  id: Spells.Atonement,
  label: "Atonement",
  passive: true,
  icon: "ability_priest_atonement",
  targetting: Targetting.None,
  cast: 0,
}

const Solace = PriestSpell({
  id: Spells.Solace,
  label: "Solace",
  icon: "ability_priest_flashoflight",
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.4,
  getDamage,
})

const Radiance = PriestSpell({
  id: Spells.Radiance,
  label: "Power Word: Radiance",
  icon: "spell_priest_power-word",
  targetting: Targetting.Friendly,
  targetCount: 6,
  cast: 2,
  applyAura: Auras.Atonement,
  auraModifiers: {
    durationPct: 0.6,
  },
  getHealing({ intellect }) {
    return intellect * 1.05
  },
})

const Boon = PriestSpell({
  id: Spells.Boon,
  label: "Boon of The Ascended",
  icon: "ability_bastion_priest",
  targetting: Targetting.Self,
  cast: 1.5,
  applyAura: Auras.Boon,
})

const AscendedBlastHeal = PriestSpell({
  id: Spells.AscendedBlastHeal,
  label: "Ascended Blast (Heal)",
  icon: "spell_animabastion_missile",
  targetting: Targetting.Friendly,
  passive: true,
  cast: 0,
})

const AscendedBlast = PriestSpell({
  id: Spells.AscendedBlast,
  label: "Ascended Blast",
  icon: "spell_animabastion_missile",
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.3,
  allowed(player) {
    return Boolean(player.getAura(Auras.Boon))
  },
  getDamage,
  onEffect(ev, encounter, player) {
    const aura = player.getAura(Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 5
  },
  onDamage: [triggerHealAsDamagePct({ k: 1.2, spell: AscendedBlastHeal })],
})

const AscendedNovaHeal = PriestSpell({
  id: Spells.AscendedNovaHeal,
  label: "Ascended Nova (Heal)",
  icon: "spell_animabastion_nova",
  targetting: Targetting.Friendly,
  targetCount: 6,
  passive: true,
  cast: 0,
})

const AscendedNova = PriestSpell({
  id: Spells.AscendedNova,
  label: "Ascended Nova",
  icon: "spell_animabastion_nova",
  targetting: Targetting.Enemy,
  cast: 0,
  gcd: 0.75,
  allowed(player) {
    return Boolean(player.getAura(Auras.Boon))
  },
  getDamage,
  onEffect(ev, encounter, player) {
    const aura = player.getAura(Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 1
  },
  onDamage: [triggerHealAsDamagePct({ k: 0.24, spell: AscendedNovaHeal })],
})

const Eruption = PriestSpell({
  id: Spells.AscendedEruption,
  label: "Ascended Eruption",
  icon: "ability_bastion_priest",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
  getDamage({ intellect }, player) {
    const aura = player.getAura(Auras.Boon)!
    return 2.1 * intellect * (1 + 0.03 * (aura.stacks || 1))
  },
})

const Schism = PriestSpell({
  id: Spells.Schism,
  label: "Schism",
  icon: "spell_warlock_focusshadow",
  targetting: Targetting.Enemy,
  applyAura: Auras.Schism,
  cast: 1.5,
  getDamage,
})

const Evangelism = PriestSpell({
  id: Spells.Evangelism,
  label: "Evangelism",
  icon: "spell_holy_divineillumination",
  targetting: Targetting.None,
  cast: 0,
  onEffect(event, es, caster) {
    for (const unit of es.friendlyUnitsIdx.values()) {
      const atonement = unit.getAura(Auras.Atonement)
      if (!atonement) continue
      const expirationEvent = atonement.links.find(
        x => !x._removed && x.value.event.type === "aura_remove"
      )
      if (!expirationEvent) continue
      atonement.expiredAt += 6
      es.scheduledEvents.removeByLink(expirationEvent)
      es.scheduledEvents.push({
        event: { ...expirationEvent.value.event },
        time: expirationEvent.value.time + 6,
      })
    }
  },
})

const SpiritShellActivate = PriestSpell({
  id: Spells.SpiritShellActivate,
  label: "Spirit Shell",
  icon: "ability_shaman_astralshift",
  targetting: Targetting.Self,
  cast: 0,
  applyAura: Auras.SpiritShellModifier,
})

const PenanceFriendly = PriestSpell({
  id: Spells.PenanceFriendly,
  label: "Penance (target friend)",
  icon: "spell_holy_penance",
  targetting: Targetting.Friendly,
  cast: 2,
  channel: {
    ticks: 3,
  },
  travelTime: 0.4,
  getHealing({ intellect }) {
    // per tick
    return 1.25 * intellect
  },
  cooldown: 9,
})

const PenanceEnemy = PriestSpell({
  id: Spells.PenanceEnemy,
  label: "Penance (offensive)",
  icon: "spell_holy_penance",
  targetting: Targetting.Enemy,
  cast: 2,
  channel: {
    ticks: 3,
  },
  travelTime: 0.4,
  getDamage,
  cooldown: 9,
})

const Rapture = PriestSpell({
  id: Spells.Rapture,
  label: "Rapture",
  icon: "spell_holy_rapture",
  targetting: Targetting.Self,
  cast: 0,
  applyAura: Auras.Rapture,
  cooldown: 90,
  onEffect(ev, es, caster) {
    es.createEventsForSpell(Spells.Shield, caster.id, false)
  },
})

const MindBlast = PriestSpell({
  id: Spells.MindBlast,
  label: "Mind Blasr",
  icon: "spell_shadow_unholyfrenzy",
  targetting: Targetting.Enemy,
  cast: 1.5,
  cooldown: 15,
  getDamage({ intellect }) {
    return intellect * 0.9792
  },
})

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
  [Spells.Pain]: Pain,
  [Spells.PainDoT]: PainDoT,
  [Spells.PurgeTheWicked]: PurgeTheWicked,
  [Spells.PurgeTheWickedDoT]: PurgeTheWickedDoT,
  [Spells.Shield]: Shield,
  [Spells.Atonement]: Atonement,
  [Spells.Solace]: Solace,
  [Spells.Radiance]: Radiance,
  [Spells.Boon]: Boon,
  [Spells.AscendedBlast]: AscendedBlast,
  [Spells.AscendedBlastHeal]: AscendedBlastHeal,
  [Spells.AscendedEruption]: Eruption,
  [Spells.AscendedNova]: AscendedNova,
  [Spells.AscendedNovaHeal]: AscendedNovaHeal,
  [Spells.Schism]: Schism,
  [Spells.Evangelism]: Evangelism,
  [Spells.SpiritShellActivate]: SpiritShellActivate,
  [Spells.PenanceFriendly]: PenanceFriendly,
  [Spells.PenanceEnemy]: PenanceEnemy,
  [Spells.Rapture]: Rapture,
  [Spells.ShadowMend]: ShadowMend,
  [Spells.MindBlast]: MindBlast,
}

const DbCoefs: Record<string, { db: number }> = {
  [Spells.Smite]: { db: 0.47 },
  [Spells.Pain]: { db: 0.1292 },
  [Spells.PurgeTheWicked]: { db: 0.223 },
  [Spells.Solace]: { db: 0.8 },
  [Spells.Schism]: { db: 1.5 },
  [Spells.PenanceEnemy]: { db: 1.2 / 3 },
  [Spells.AscendedBlast]: { db: 1.79 },
  [Spells.AscendedNova]: { db: 0.74 },
}
