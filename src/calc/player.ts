import { Aura } from "./auras"
import { Spells } from "./spells"

export type UnitState =
  | { type: "idle" }
  | { type: "casting"; spell: Spells; start: number; end: number }
  | { type: "gcd"; start: number; end: number }

export class CombatState {
  auras = new Map<any, Aura>()
  state: UnitState = { type: "idle" }
}

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

export type StatScalings = StatRatingsIn

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
}

export class Player {
  id: string
  stats: StatsHandler
  combatState: CombatState

  constructor(args: { id: string }) {
    this.id = args.id
    this.stats = new StatsHandler({ ratings: TEMPLATE_STATS })
    this.combatState = new CombatState()
  }
}

export class Enemy {
  id: string
  combatState = new CombatState()
  constructor(args: { id: string }) {
    this.id = args.id
  }
}
