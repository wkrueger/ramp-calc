import type { EncounterState } from "./EncounterState"
import { Auras } from "./aurasConstants"
import {
  DamageEffect,
  HealEffect,
  triggerAtonement,
  triggerContrition,
  triggerHealAsDamagePct,
} from "./damageEffects"
import type { CombatEvent, PickFromUn } from "./events"
import type { Player } from "./Player"
import { Spells } from "./spellsConstants"
import { StatRatingsIn } from "./StatsHandler"
import { Talents } from "../data/talents"

export enum Targetting {
  Self,
  Enemy,
  Friendly,
  None,
}

export interface Spell {
  id: Spells
  gameId?: number
  label: string
  cast: number
  icon: string
  channel?:
    | {
        ticks: number
      }
    | ((p: Player) => { ticks: number })
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
  onCastSuccess?: (
    event: PickFromUn<CombatEvent, "spell_cast_success">,
    es: EncounterState,
    caster: Player
  ) => void
  onDamage?: Array<DamageEffect> // attaches to damage event, runs after damage calc
  onHeal?: Array<HealEffect>
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
  allowed(player) {
    return !player.getTalent(Talents.PurgeTheWicked)
  },
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
  gameId: 204197,
  label: "Purge the Wicked",
  icon: "ability_mage_firestarter",
  targetting: Targetting.Enemy,
  cast: 0,
  getDamage,
  applyAura: Auras.PurgeTheWicked,
  allowed(player) {
    return Boolean(player.getTalent(Talents.PurgeTheWicked))
  },
})

const PurgeTheWickedDoT = PriestSpell({
  id: Spells.PurgeTheWickedDoT,
  label: "Purge the Wicked (DoT)",
  icon: "ability_mage_firestarter",
  targetting: Targetting.Enemy,
  passive: true,
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
  allowed(player) {
    return Boolean(player.getTalent(Talents.Solace))
  },
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
  onCastSuccess(ev, encounter, player) {
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
  onCastSuccess(ev, encounter, player) {
    const aura = player.getAura(Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 1
  },
  onDamage: [triggerHealAsDamagePct({ k: 0.24, spell: AscendedNovaHeal })],
})

const AscendedEruption = PriestSpell({
  id: Spells.AscendedEruption,
  label: "Ascended Eruption",
  icon: "ability_bastion_priest",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
  getDamage({ intellect }, player) {
    const boonAura = player.getAura(Auras.Boon)!
    const courageousAscensionMult = Boolean(player.getAura(Auras.CourageousAscension))
      ? 1 + (boonAura.stacks || 1) * 0.01
      : 1
    return 2.1 * intellect * (1 + 0.03 * (boonAura.stacks || 1)) * courageousAscensionMult
  },
})

const Schism = PriestSpell({
  id: Spells.Schism,
  label: "Schism",
  icon: "spell_warlock_focusshadow",
  targetting: Targetting.Enemy,
  // applyAura: Auras.Schism,
  cast: 1.5,
  getDamage,
  allowed(player) {
    return Boolean(player.getTalent(Talents.Schism))
  },
  onCastSuccess(_event, es, caster) {
    es.scheduledEvents.push({
      time: es.time,
      event: {
        id: es.createEventId(),
        type: "aura_apply",
        aura: Auras.Schism,
        source: caster.id,
        target: caster.id,
      },
    })
  },
})

const Evangelism = PriestSpell({
  id: Spells.Evangelism,
  label: "Evangelism",
  icon: "spell_holy_divineillumination",
  targetting: Targetting.None,
  cast: 0,
  allowed(player) {
    return Boolean(player.getTalent(Talents.Evangelism))
  },
  onCastSuccess(event, es, caster) {
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
  allowed(player) {
    return Boolean(player.getTalent(Talents.SpiritShell))
  },
})

const SpiritShellHeal = PriestSpell({
  id: Spells.SpiritShellHeal,
  label: "Spirit Shell",
  icon: "ability_shaman_astralshift",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
})

const PenanceFriendly = PriestSpell({
  id: Spells.PenanceFriendly,
  label: "Penance (target friend)",
  icon: "spell_holy_penance",
  targetting: Targetting.Friendly,
  cast: 2,
  channel: player => {
    const nticks = player.getTalent(Talents.Castigation) ? 4 : 3
    return { ticks: nticks }
  },
  travelTime: 0.4,
  getHealing({ intellect }) {
    // per tick
    return 1.25 * intellect
  },
  cooldown: 9,
  onHeal: [triggerContrition],
})

const PenanceEnemy = PriestSpell({
  id: Spells.PenanceEnemy,
  label: "Penance (offensive)",
  icon: "spell_holy_penance",
  targetting: Targetting.Enemy,
  cast: 2,
  channel: player => {
    const nticks = player.getTalent(Talents.Castigation) ? 4 : 3
    return { ticks: nticks }
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
  onCastSuccess(ev, es, caster) {
    const events = es.getEventsForSpell({
      spellId: Spells.Shield,
      source: caster.id,
      queueNext: false,
    })
    events.scheduledEvents.forEach(ev => {
      es.scheduledEvents.push(ev)
    })
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

const ShadowCovenant = PriestSpell({
  id: Spells.ShadowCovenant,
  label: "Shadow Covenant",
  icon: "spell_shadow_summonvoidwalker",
  cast: 0,
  cooldown: 30,
  targetting: Targetting.Friendly,
  allowed(player) {
    return Boolean(player.getTalent(Talents.ShadowCovenant))
  },
  getHealing(stats) {
    return 1.65 * stats.intellect
  },
  targetCount: 5,
  onCastSuccess(event, es, caster) {
    const toQueue = es.getEventsForSpell({
      source: caster.id,
      spellId: Spells.ShadowCovenantApplyAura,
      allowPassive: true,
      queueNext: false,
    })
    for (let each of toQueue.scheduledEvents) {
      es.scheduledEvents.push(each)
    }
  },
})

const ShadowCovenantApplyAura = PriestSpell({
  id: Spells.ShadowCovenantApplyAura,
  label: "Shadow Covenant (apply aura)",
  cast: 0,
  icon: "spell_shadow_summonvoidwalker",
  targetting: Targetting.Self,
  passive: true,
  applyAura: Auras.ShadowCovenant,
})

const Shadowfiend = PriestSpell({
  id: Spells.Shadowfiend,
  label: "Shadowfiend",
  icon: "spell_shadow_shadowfiend",
  targetting: Targetting.Enemy,
  cast: 0,
  cooldown: 180,
  applyAura: Auras.ShadowfiendAura,
  allowed(player) {
    return !player.getTalent(Talents.Mindbender)
  },
})

const ShadowfiendDoT = PriestSpell({
  id: Spells.ShadowfiendDoT,
  label: "Shadowfiend (DoT)",
  icon: "spell_shadow_shadowfiend",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
})

const Mindbender = PriestSpell({
  id: Spells.Mindbender,
  label: "Mindbender",
  icon: "spell_shadow_soulleech_3",
  targetting: Targetting.Enemy,
  cast: 0,
  cooldown: 60,
  applyAura: Auras.MindbenderAura,
  allowed(player) {
    return Boolean(player.getTalent(Talents.Mindbender))
  },
})

const MindbenderDoT = PriestSpell({
  id: Spells.MindbenderDoT,
  label: "Mindbender (DoT)",
  icon: "spell_shadow_soulleech_3",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
})

const Contrition = PriestSpell({
  id: Spells.Contrition,
  label: "Contrition",
  icon: "ability_priest_savinggrace",
  targetting: Targetting.Friendly,
  cast: 0,
  passive: true,
  getHealing({ intellect }) {
    return DbCoefs[Spells.Contrition].db * intellect
  },
})

const DivineStarActivate = PriestSpell({
  id: Spells.DivineStarActivate,
  label: "Divine Star",
  icon: "spell_priest_divinestar",
  targetting: Targetting.Friendly,
  cast: 0,
  allowed(player) {
    return Boolean(player.getTalent(Talents.DivineStar))
  },
  onCastSuccess(ev, es) {
    const { scheduledEvents: sch0 } = es.getEventsForSpell({
      spellId: Spells.DivineStarHeal,
      source: ev.source,
      allowPassive: true,
      queueNext: false,
    })
    const { scheduledEvents: sch1 } = es.getEventsForSpell({
      spellId: Spells.DivineStarDamage,
      source: ev.source,
      allowPassive: true,
      queueNext: false,
    })
    const { scheduledEvents: sch2 } = es.getEventsForSpell({
      spellId: Spells.DivineStarHeal,
      source: ev.source,
      allowPassive: true,
      queueNext: false,
      time: es.time + 0.5,
    })
    const { scheduledEvents: sch3 } = es.getEventsForSpell({
      spellId: Spells.DivineStarDamage,
      source: ev.source,
      allowPassive: true,
      queueNext: false,
      time: es.time + 0.5,
    })
    const scheduledEvents = [...sch0, ...sch1, ...sch2, ...sch3]
    scheduledEvents.forEach(toSet => {
      es.scheduledEvents.push(toSet)
    })
  },
})

const DivineStarHeal = PriestSpell({
  id: Spells.DivineStarHeal,
  label: "Divine Star (Heal)",
  icon: "spell_priest_divinestar",
  targetting: Targetting.Friendly,
  passive: true,
  targetCount: 6,
  cast: 0,
  travelTime: 0.5,
  getHealing(stats) {
    return stats.intellect * DbCoefs[Spells.DivineStarHeal].db
  },
})

const DivineStarDamage = PriestSpell({
  id: Spells.DivineStarDamage,
  label: "Divine Star",
  icon: "spell_priest_divinestar",
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.5,
  targetCount: 6,
  passive: true,
  getDamage(stats) {
    return stats.intellect * DbCoefs[Spells.DivineStarDamage].db
  },
})

const HaloHeal = PriestSpell({
  id: Spells.HaloHeal,
  label: "Halo",
  icon: "ability_priest_halo",
  cast: 1.5,
  targetting: Targetting.Friendly,
  targetCount: 20,
  travelTime: 0.5,
  allowed(player) {
    return Boolean(player.getTalent(Talents.Halo))
  },
  getHealing(stats) {
    return stats.intellect * DbCoefs[Spells.HaloHeal].db
  },
  onCastSuccess(ev, es) {
    const { scheduledEvents } = es.getEventsForSpell({
      spellId: Spells.HaloDamage,
      source: ev.source,
      allowPassive: true,
      queueNext: false,
    })
    scheduledEvents.forEach(toSet => {
      es.scheduledEvents.push(toSet)
    })
  },
})

const HaloDamage = PriestSpell({
  id: Spells.HaloDamage,
  label: "Halo",
  icon: "ability",
  cast: 0,
  targetting: Targetting.Enemy,
  passive: true,
  travelTime: 0.5,
  getDamage,
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
  [Spells.AscendedEruption]: AscendedEruption,
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
  [Spells.ShadowCovenant]: ShadowCovenant,
  [Spells.ShadowCovenantApplyAura]: ShadowCovenantApplyAura,
  [Spells.Shadowfiend]: Shadowfiend,
  [Spells.ShadowfiendDoT]: ShadowfiendDoT,
  [Spells.Mindbender]: Mindbender,
  [Spells.MindbenderDoT]: MindbenderDoT,
  [Spells.Contrition]: Contrition,
  [Spells.DivineStarActivate]: DivineStarActivate,
  [Spells.DivineStarHeal]: DivineStarHeal,
  [Spells.DivineStarDamage]: DivineStarDamage,
  [Spells.HaloHeal]: HaloHeal,
  [Spells.HaloDamage]: HaloDamage,
  [Spells.SpiritShellActivate]: SpiritShellActivate,
  [Spells.SpiritShellHeal]: SpiritShellHeal,
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
  [Spells.Contrition]: { db: 0.144 },
  [Spells.DivineStarHeal]: { db: 0.7 },
  [Spells.DivineStarDamage]: { db: 0.56 },
  [Spells.HaloHeal]: { db: 1.15 },
  [Spells.HaloDamage]: { db: 1.03 },
  [Spells.ShadowCovenant]: { db: 1.65 },
}
