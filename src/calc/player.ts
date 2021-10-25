import { Aura, Auras } from "./auras"
import { Spells } from "./spells"

export type UnitState =
  | { type: "idle" }
  | { type: "casting"; spell: Spells; start: number; end: number }
  | { type: "gcd"; start: number; end: number }

export interface StatRatingsIn {
  haste: number
  crit: number
  mastery: number
  vers: number
  intellect: number
}

export const TEMPLATE_STATS: StatRatingsIn = {
  haste: 500,
  crit: 500,
  mastery: 500,
  vers: 200,
  intellect: 1500,
}

export class StatsHandler {
  protected ratings: StatRatingsIn

  constructor(args: { ratings: StatRatingsIn }) {
    this.ratings = args.ratings
  }

  getStatRatings() {
    return this.ratings
  }

  getHastePct() {
    return this.ratings.haste * 0.0005
  }

  getMasteryPct() {
    return this.ratings.mastery * 0.001
  }
}

export class Player {
  id: string
  stats: StatsHandler
  auras: Aura[] = []
  protected recharges = new Map<Spells, number>()

  getAura(aura: Auras, opts: { caster?: string } = {}) {
    const found = this.auras.find((x) => {
      const match = x.id === aura
      const casterMatch = opts.caster ? x.caster === opts.caster : true
      return match && casterMatch
    })
    return found
  }

  canCastSpell(args: { time: number; spell: Spells }) {
    const found = this.recharges.get(args.spell)
    if (!found) return true
    return args.time >= found
  }

  setSpellRecharge(spell: Spells, time: number) {
    this.recharges.set(spell, time)
  }

  constructor(args: { id: string }) {
    this.id = args.id
    this.stats = new StatsHandler({ ratings: TEMPLATE_STATS })
  }
}

export class Enemy {
  id: string
  auras: Aura[] = []

  constructor(args: { id: string }) {
    this.id = args.id
  }

  getAura(aura: Auras, opts: { caster?: string } = {}) {
    const found = this.auras.find((x) => {
      const match = x.id === aura
      const casterMatch = opts.caster ? x.caster === opts.caster : true
      return match && casterMatch
    })
    return found
  }
}
