import { TalentInfo, Talents } from "../data/talents"
import { Aura, auras } from "./auras"
import { Auras } from "./aurasConstants"
import type { CombatEvent } from "./events"
import { Spells } from "./spellsConstants"
import { StatRatingsIn, StatsHandler } from "./StatsHandler"

// export type UnitState =
//   | { type: "idle" }
//   | { type: "casting"; spell: Spells; start: number; end: number }
//   | { type: "gcd"; start: number; end: number }

export class Player {
  id: string
  stats: StatsHandler
  private auras: Aura[] = []
  private talents: Partial<Record<Talents, TalentInfo>> = {}
  protected recharges = new Map<Spells, number>()
  private damageMultAurasBySpell: Map<Spells, Map<Auras, number>>
  private atonementCount = 0

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

  constructor(args: { id: string; statRatings: StatRatingsIn; talents?: TalentInfo[] }) {
    this.id = args.id
    this.stats = new StatsHandler({ ratings: args.statRatings })
    this.damageMultAurasBySpell = new Map()
    for (let talent of args.talents || []) {
      this.talents[talent.code] = talent
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
    if (info?.damageMultiplier) {
      for (let [spell, value] of info.damageMultiplier.entries()) {
        let found = this.damageMultAurasBySpell.get(spell)
        if (!found) {
          found = new Map()
          this.damageMultAurasBySpell.set(spell, found)
        }
        found.set(aura.id, value)
      }
    }
  }

  removeAura({ eventReference }: { eventReference: number }) {
    const index = this.auras.findIndex(aura => aura.eventReference === eventReference)
    if (index === -1) {
      throw Error("Target aura not found.")
    }
    const aura = this.auras[index]
    const info = auras[aura.id]
    if (info?.damageMultiplier) {
      for (let spell of info.damageMultiplier.keys()) {
        this.damageMultAurasBySpell.get(spell)?.delete(aura.id)
      }
    }
    this.auras.splice(index, 1)
  }

  getTalent(code: Talents) {
    return this.talents[code]
  }

  getDamageMultiplier(spell: Spells) {
    let baseMult = 1
    if (this.getTalent(Talents.SinsOfTheMany)) {
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

  canCastSpell(args: { time: number; spell: Spells }) {
    const found = this.recharges.get(args.spell)
    if (!found) return true
    return args.time >= found
  }

  setSpellRecharge(spell: Spells, time: number) {
    this.recharges.set(spell, time)
  }

  onEvent(event: CombatEvent) {
    if (this.id !== "0") return
    if (event.type === "aura_apply" && event.aura === Auras.Atonement) {
      this.atonementCount++
    } else if (event.type === "aura_remove" && event.aura === Auras.Atonement) {
      this.atonementCount--
    }
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

  removeAura({ eventReference }: { eventReference: number }) {
    const index = this.auras.findIndex(aura => aura.eventReference === eventReference)
    if (index === -1) {
      throw Error("Target aura not found.")
    }
    this.auras.splice(index, 1)
  }
}
