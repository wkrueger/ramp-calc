import { TalentInfo, Talents, talentsIdx } from "../data/talents"
import { Aura, auras } from "./auras"
import { Auras } from "./constants/aurasConstants"
import type { CombatEvent } from "./eventEffects"
import type { Spell } from "./spells"
import { Spells } from "./constants/spellsConstants"
import { StatRatingsIn, StatsHandler } from "./StatsHandler"

// export type UnitState =
//   | { type: "idle" }
//   | { type: "casting"; spell: Spells; start: number; end: number }
//   | { type: "gcd"; start: number; end: number }

const ShadowCovenantSpells = new Set([
  Spells.MindBlast,
  Spells.Pain,
  Spells.PurgeTheWicked,
  Spells.Schism,
  Spells.ShadowMend,
])

export class Player {
  id: string
  stats: StatsHandler
  private auras: Aura[] = []
  private talents: Partial<Record<Talents, TalentInfo>> = {}
  protected recharges = new Map<Spells, number>()
  private damageMultAurasBySpell: Map<Spells, Map<Auras, number>>
  private healingMultAurasBySpell: Map<Spells, Map<Auras, number>>
  private atonementCount = 0

  private procBucket: Record<string, number> = {}

  SINS_DMG_MULT = {
    1: 1.12,
    2: 1.1,
    3: 1.08,
    4: 1.07,
    5: 1.06,
    6: 1.06,
    7: 1.05,
    8: 1.04,
    9: 1.04,
    10: 1.03,
  }

  constructor(args: { id: string; statRatings: StatRatingsIn; talents?: Talents[] }) {
    this.id = args.id
    this.stats = new StatsHandler({ ratings: args.statRatings })
    this.damageMultAurasBySpell = new Map()
    this.healingMultAurasBySpell = new Map()
    for (let talent of args.talents || []) {
      const obj = talentsIdx[talent]
      this.talents[talent] = obj
    }
  }

  getAura(aura: Auras, opts: { caster?: string } = {}) {
    const found = this.auras.find(x => {
      const match = x.id === aura
      const casterMatch = opts.caster ? x.caster === opts.caster : true
      return match && casterMatch
    })
    return found
  }

  addAura(aura: Aura) {
    this.auras.push(aura)
    const info = auras[aura.id]
    if (info!.damageMultiplier) {
      for (let [spell, value] of info!.damageMultiplier({ aura, caster: this }).entries()) {
        let found = this.damageMultAurasBySpell.get(spell)
        if (!found) {
          found = new Map()
          this.damageMultAurasBySpell.set(spell, found)
        }
        found.set(aura.id, value)
      }
    }
    if (info!.healingMultiplier) {
      for (let [spell, value] of info!.healingMultiplier({ aura, caster: this }).entries()) {
        let found = this.healingMultAurasBySpell.get(spell)
        if (!found) {
          found = new Map()
          this.healingMultAurasBySpell.set(spell, found)
        }
        found.set(aura.id, value)
      }
    }
  }

  removeAura(id: Auras) {
    const auraIdx = this.auras.findIndex(a => a.id === id)
    if (auraIdx === -1) return
    const aura = this.auras[auraIdx]
    if (!aura) return
    const info = auras[aura.id]
    if (info?.damageMultiplier) {
      for (let spell of info.damageMultiplier({ aura, caster: this }).keys()) {
        this.damageMultAurasBySpell.get(spell)?.delete(aura.id)
      }
    }
    if (info?.healingMultiplier) {
      for (let spell of info.healingMultiplier({ aura, caster: this }).keys()) {
        this.healingMultAurasBySpell.get(spell)?.delete(aura.id)
      }
    }
    this.auras.splice(auraIdx, 1)
  }

  getTalent(code: Talents) {
    return this.talents[code]
  }

  PET_DMG = [Spells.ShadowfiendDoT, Spells.MindbenderDoT]

  getDamageMultiplier(spell: Spells) {
    let baseMult = 1
    const isPetDmg = this.PET_DMG.includes(spell)
    if (this.getTalent(Talents.SinsOfTheMany) && !isPetDmg) {
      if (this.atonementCount <= 1) baseMult = this.SINS_DMG_MULT[1]
      else if (this.atonementCount >= 10) baseMult = this.SINS_DMG_MULT[10]
      else baseMult = (this.SINS_DMG_MULT as any)[this.atonementCount]
    }
    const found = this.damageMultAurasBySpell.get(spell)
    if (!found) return baseMult
    let out = baseMult
    for (let mult of found.values()) {
      out = out * mult
    }
    return out
  }

  getHealingMultiplier(spell: Spells) {
    let baseMult = 1
    const found = this.healingMultAurasBySpell.get(spell)
    if (!found) return baseMult
    let out = baseMult
    for (let mult of found.values()) {
      out = out * mult
    }
    return out
  }

  canCastSpell(args: { time: number; spell: Spells }) {
    const found = this.recharges.get(args.spell)
    if (!found) return true
    return args.time >= found
  }

  setSpellRecharge(spellInfo: Spell, time: number) {
    if (spellInfo.passive) return
    this.recharges.set(spellInfo.id, time)
  }

  onEvent(event: CombatEvent) {
    if (this.id !== "0") return
    if (event.type === "aura_apply" && event.aura === Auras.Atonement) {
      this.atonementCount++
    } else if (event.type === "aura_remove" && event.aura === Auras.Atonement) {
      this.atonementCount--
    }
  }

  spellIsAllowed(info: Spell) {
    if (this.auras.some(a => a.id === Auras.ShadowCovenant)) {
      if (!ShadowCovenantSpells.has(info.id)) return false
    }
    if (info.allowed) {
      return info.allowed(this)
    }
    return true
  }

  tryProcBucket(code: string, chance: number) {
    if (this.procBucket[code]) this.procBucket[code] = 0
    const newVal = (this.procBucket[code] += chance)
    if (newVal >= 1) {
      this.procBucket[code] = 0
      return true
    }
    return false
  }
}

export class Enemy {
  id: string
  private auras: Aura[] = []

  constructor(args: { id: string }) {
    this.id = args.id
  }

  getAura(aura: Auras, opts: { caster?: string } = {}) {
    const found = this.auras.find(x => {
      const match = x.id === aura
      const casterMatch = opts.caster ? x.caster === opts.caster : true
      return match && casterMatch
    })
    return found
  }

  addAura(aura: Aura) {
    this.auras.push(aura)
  }

  removeAura(id: Auras) {
    const index = this.auras.findIndex(aura => aura.id === id)
    if (index === -1) {
      return
    }
    this.auras.splice(index, 1)
  }
}
