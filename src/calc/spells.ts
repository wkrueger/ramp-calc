import { EncounterState } from "."
import { Auras } from "./auras"
import { CombatEvent, PickFromUn } from "./events"
import { Player, StatRatingsIn } from "./player"

export enum Spells {
  Smite = "smite",
  Shield = "shield",
  Radiance = "radiance",
  Solace = "solace",
  Boon = "boon",
  AscendedBlast = "ascended-blast",
  AscendedNova = "ascended-nova",
  AscendedEruption = "ascendederuption",
  Pain = "pain",
  PurgeTheWicked = "purge-the-wicked",
  Atonement = "atonement-heal",
  PenanceFriendly = "penance-friendly",
  PenanceEnemy = "penance-enemy",
  Schism = "schism",
  Evangelism = "evangelism",
  SpiritShellHeal = "spirit-shell",
  SpiritShellActivate = "spirit-shell-activate",
  Rapture = "rapture",
  ShadowMend = "shadow-mend",
}

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
  getDamage?: (stats: StatRatingsIn, player: Player) => number
  getHealing?: (stats: StatRatingsIn, caster: Player) => number
  onEffect?: (event: CombatEvent, es: EncounterState, caster: Player) => void
  allowed?: (player: Player) => boolean
}

const Smite: Spell = {
  id: Spells.Smite,
  label: "Smite",
  icon: "spell_holy_holysmite",
  targetting: Targetting.Enemy,
  cast: 1.5,
  getDamage: ({ intellect }) => intellect * 0.47,
}

const Pain: Spell = {
  id: Spells.Pain,
  label: "Shadow Word: Pain",
  icon: "spell_shadow_shadowwordpain",
  targetting: Targetting.Enemy,
  cast: 0,
  getDamage(stats) {
    return 0.1292 * stats.intellect
  },
  applyAura: Auras.Pain,
}

const PurgeTheWicked: Spell = {
  id: Spells.PurgeTheWicked,
  label: "Purge the Wicked",
  icon: "ability_mage_firestarter",
  targetting: Targetting.Enemy,
  cast: 0,
  getDamage(stats) {
    return 0.223 * stats.intellect
  },
  applyAura: Auras.PurgeTheWicked,
}

const Shield: Spell = {
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
}

const ShadowMend: Spell = {
  id: Spells.ShadowMend,
  label: "Shadow Mend",
  icon: "spell_shadow_shadowmend",
  targetting: Targetting.Friendly,
  applyAura: Auras.Atonement,
  cast: 1.5,
  getHealing({ intellect }) {
    return 3.2 * intellect
  },
}

const Atonement: Spell = {
  id: Spells.Atonement,
  label: "Atonement",
  passive: true,
  icon: "ability_priest_atonement",
  targetting: Targetting.None,
  cast: 0,
}

const Solace: Spell = {
  id: Spells.Solace,
  label: "Solace",
  icon: "ability_priest_flashoflight",
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.4,
  getDamage({ intellect }) {
    return 0.8 * intellect
  },
}

const Radiance: Spell = {
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
}

const Boon: Spell = {
  id: Spells.Boon,
  label: "Boon of The Ascended",
  icon: "ability_bastion_priest",
  targetting: Targetting.Self,
  cast: 1.5,
  applyAura: Auras.Boon,
}

const Blast: Spell = {
  id: Spells.AscendedBlast,
  label: "Ascended Blast",
  icon: "spell_animabastion_missile",
  targetting: Targetting.Enemy,
  cast: 0,
  travelTime: 0.3,
  allowed(player) {
    return Boolean(player.getAura(Auras.Boon))
  },
  getDamage({ intellect }) {
    return 1.79 * intellect
  },
  onEffect(ev, encounter, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 5
  },
}

const Nova: Spell = {
  id: Spells.AscendedNova,
  label: "Ascended Nova",
  icon: "spell_animabastion_nova",
  targetting: Targetting.Enemy,
  cast: 0,
  gcd: 0.75,
  allowed(player) {
    return Boolean(player.getAura(Auras.Boon))
  },
  getDamage({ intellect }) {
    return 0.74 * intellect
  },
  onEffect(ev, encounter, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    aura.stacks = (aura.stacks || 1) + 1
  },
}

const Eruption: Spell = {
  id: Spells.AscendedEruption,
  label: "Ascended Eruption",
  icon: "ability_bastion_priest",
  targetting: Targetting.Enemy,
  cast: 0,
  passive: true,
  getDamage({ intellect }, player) {
    const aura = player.auras.find((x) => x.id === Auras.Boon)!
    return 2.1 * intellect * (1 + 0.03 * (aura.stacks || 1))
  },
}

const Schism: Spell = {
  id: Spells.Schism,
  label: "Schism",
  icon: "spell_warlock_focusshadow",
  targetting: Targetting.Enemy,
  applyAura: Auras.Schism,
  cast: 1.5,
  getDamage({ intellect }) {
    return 1.5 * intellect
  },
}

const Evangelism: Spell = {
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
        (x) => !x._removed && x.value.event.type === "aura_remove"
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
}

const SpiritShellActivate: Spell = {
  id: Spells.SpiritShellActivate,
  label: "Spirit Shell",
  icon: "ability_shaman_astralshift",
  targetting: Targetting.Self,
  cast: 0,
  applyAura: Auras.SpiritShellModifier,
}

const PenanceFriendly: Spell = {
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
}

const PenanceEnemy: Spell = {
  id: Spells.PenanceEnemy,
  label: "Penance (offensive)",
  icon: "spell_holy_penance",
  targetting: Targetting.Enemy,
  cast: 2,
  channel: {
    ticks: 3,
  },
  travelTime: 0.4,
  getDamage({ intellect }) {
    return 0.4 * intellect
  },
  cooldown: 9,
}

const Rapture: Spell = {
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
}

export const spells: Record<string, Spell> = {
  [Spells.Smite]: Smite,
  [Spells.Pain]: Pain,
  [Spells.PurgeTheWicked]: PurgeTheWicked,
  [Spells.Shield]: Shield,
  [Spells.Atonement]: Atonement,
  [Spells.Solace]: Solace,
  [Spells.Radiance]: Radiance,
  [Spells.Boon]: Boon,
  [Spells.AscendedBlast]: Blast,
  [Spells.AscendedEruption]: Eruption,
  [Spells.AscendedNova]: Nova,
  [Spells.Schism]: Schism,
  [Spells.Evangelism]: Evangelism,
  [Spells.SpiritShellActivate]: SpiritShellActivate,
  [Spells.PenanceFriendly]: PenanceFriendly,
  [Spells.PenanceEnemy]: PenanceEnemy,
  [Spells.Rapture]: Rapture,
  [Spells.ShadowMend]: ShadowMend,
}
