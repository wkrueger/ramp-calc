import { Auras, DURATION_INFINITE } from "./constants/aurasConstants"
import { conduits } from "./conduits"
import type { EncounterState } from "./EncounterState"
import type { CombatEvent, PickFromUn } from "./eventEffects"
import type { Link } from "./ScheduledEvents"
import { Spells } from "./constants/spellsConstants"
import { StatRatingsIn } from "./StatsHandler"

export interface Aura {
  id: Auras
  caster: string
  eventReference: number
  appliedAt: number
  expiredAt: number
  stacks?: number
  links: Link[]
  level?: number
}

export interface AuraInfo {
  id: Auras
  duration: number | typeof DURATION_INFINITE
  dot?: {
    spell: Spells
    interval: number
    getDoTDamage: (stats: StatRatingsIn, auraInfo: AuraInfo) => number
  }
  damageMultiplier?: (i: { aura: Aura }) => Map<Spells, number>
  healingMultiplier?: (i: { aura: Aura }) => Map<Spells, number>
  onExpire?: (event: PickFromUn<CombatEvent, "aura_remove">, encounter: EncounterState) => void
}

function getDoTDamage(stats: StatRatingsIn, auraInfo: AuraInfo) {
  const coef = DbCoefs[auraInfo.id]!.db
  return stats.intellect * coef
}

const Atonement: AuraInfo = {
  id: Auras.Atonement,
  duration: 12,
}

const Boon: AuraInfo = {
  id: Auras.Boon,
  duration: 10,
  onExpire(event, encounter) {
    const { spells } = require("./spells") as typeof import("./spells")
    const player = encounter.friendlyUnitsIdx.get(event.target)!
    const eruptionSpell = spells[Spells.AscendedEruption]
    const currentTarget = encounter.getSpellTarget(
      spells[Spells.AscendedEruption],
      event.target
    )[0]!
    const dmg = eruptionSpell.getDamage!(player.stats.getStatRatings(), player, null as any) // danger
    encounter.scheduledEvents.push({
      time: encounter.time,
      event: {
        type: "dmg",
        id: encounter.createEventId(),
        source: event.target,
        target: currentTarget?.id!,
        value: dmg,
        spell: Spells.AscendedEruption,
      },
    })
  },
}

const Pain: AuraInfo = {
  id: Auras.Pain,
  duration: 12,
  dot: {
    spell: Spells.PainDoT,
    interval: 2,
    getDoTDamage,
  },
}

const PurgeTheWicked: AuraInfo = {
  id: Auras.PurgeTheWicked,
  duration: 20,
  dot: {
    spell: Spells.PurgeTheWickedDoT,
    interval: 2,
    getDoTDamage,
  },
}

const Rapture: AuraInfo = {
  id: Auras.Rapture,
  duration: 8,
}

// hack: apply as buff
const Schism: AuraInfo = {
  id: Auras.Schism,
  duration: 9,
  damageMultiplier: () =>
    new Map(
      Object.values(Spells)
        .filter(name => ![Spells.ShadowfiendDoT, Spells.MindbenderDoT].includes(name))
        .map(name => {
          return [name, 1.25]
        })
    ),
}

const ShadowCovenant: AuraInfo = {
  id: Auras.ShadowCovenant,
  duration: 7,
  damageMultiplier: () =>
    new Map([
      [Spells.MindBlast, 1.25],
      [Spells.Pain, 1.25],
      [Spells.PainDoT, 1.25],
      [Spells.PurgeTheWicked, 1, 25],
      [Spells.PurgeTheWickedDoT, 1.25],
      [Spells.Schism, 1.25],
    ] as any),
  healingMultiplier: () => new Map([[Spells.ShadowMend, 1.25]] as any),
}

const SpiritShellModifier: AuraInfo = {
  id: Auras.SpiritShellModifier,
  duration: 10,
}
const SinsOfTheMany: AuraInfo = {
  id: Auras.SinsOfTheMany,
  duration: DURATION_INFINITE,
}

const DisciplineSpec: AuraInfo = {
  id: Auras.DisciplineSpec,
  duration: DURATION_INFINITE,
  damageMultiplier: () =>
    new Map(
      Object.entries({
        [Spells.Smite]: 0.7 * 1.5,
        [Spells.Pain]: 1.01,
        [Spells.PurgeTheWicked]: 0.94,
        [Spells.Solace]: 0.94,
        [Spells.Schism]: 0.94,
        [Spells.PenanceEnemy]: 0.94,
        [Spells.MindBlast]: 0.76,
        [Spells.PainDoT]: 1.01,
        [Spells.PurgeTheWickedDoT]: 0.94,
      }) as any
    ),
}

const ShadowfiendAura: AuraInfo = {
  id: Auras.ShadowfiendAura,
  duration: 15,
  dot: {
    spell: Spells.ShadowfiendDoT,
    interval: 1.5,
    getDoTDamage,
  },
}

const MindbenderAura: AuraInfo = {
  id: Auras.MindbenderAura,
  duration: 12,
  dot: {
    spell: Spells.MindbenderDoT,
    interval: 1.5,
    getDoTDamage,
  },
}

export const auras: Partial<Record<Auras, AuraInfo>> = {
  [Auras.Pain]: Pain,
  [Auras.PurgeTheWicked]: PurgeTheWicked,
  [Auras.Atonement]: Atonement,
  [Auras.Boon]: Boon,
  [Auras.Schism]: Schism,
  [Auras.SpiritShellModifier]: SpiritShellModifier,
  [Auras.Rapture]: Rapture,
  [Auras.DisciplineSpec]: DisciplineSpec,
  [Auras.SinsOfTheMany]: SinsOfTheMany,
  [Auras.ShadowCovenant]: ShadowCovenant,
  [Auras.ShadowfiendAura]: ShadowfiendAura,
  [Auras.MindbenderAura]: MindbenderAura,
  ...conduits,
}

const DbCoefs: Partial<Record<Auras, { db: number }>> = {
  [Auras.Pain]: { db: 0.57528 },
  [Auras.PurgeTheWicked]: { db: 1.24 },
  [Auras.ShadowfiendAura]: { db: 4.962 },
  [Auras.MindbenderAura]: { db: 3.2455 },
}
