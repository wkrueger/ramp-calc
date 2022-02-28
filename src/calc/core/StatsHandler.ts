export interface StatRatingsIn {
  haste: number
  critical: number
  mastery: number
  versatility: number
  intellect: number
}

const CONVERSION_TABLE = {
  critical: 35, // 35 rating for 1%
  haste: 33,
  versatility: 40,
  mastery: 35, // conversion to mastery points, an intermediary stat
}

// for priest
const BASE_PCT_LV60 = {
  critical: 6,
  mastery: 10.8,
  haste: 0,
  versatility: 0,
}

// 1 mastery point gives 1.35% atonement transfer for disx priest
const MASTERY_POINT_RATING = 1.35

const PENALTY_TABLE = new Map([
  [[0, 0.3], 0],
  [[0.3, 0.39], 0.1],
  [[0.39, 0.47], 0.2],
  [[0.47, 0.54], 0.3],
  [[0.54, 0.66], 0.4],
  [[0.66, 1.26], 0.5],
  [[1.26, Infinity], 1],
])

function applyStatDR(value: number) {
  let out = 0
  // let lastRange = null
  for (let [[from, to], penalty] of PENALTY_TABLE.entries()) {
    if (value < from) {
      // console.log({ lastRange })
      return out
    }
    // lastRange = from
    const slice = Math.min(value, to) - from
    out += slice * (1 - penalty)
  }
  return out
}

export class StatsHandler {
  protected ratings: StatRatingsIn
  conversionTable = CONVERSION_TABLE
  basePct = BASE_PCT_LV60
  masteryPointRating = MASTERY_POINT_RATING

  constructor(args: { ratings: StatRatingsIn }) {
    this.ratings = args.ratings
  }

  getStatRatings() {
    return this.ratings
  }

  getHastePct() {
    const beforeDR = this.ratings.haste / this.conversionTable.haste / 100
    const fromRating = applyStatDR(beforeDR)
    return this.basePct.haste / 100 + fromRating
  }

  getCriticalPct() {
    const fromRating = applyStatDR(this.ratings.critical / this.conversionTable.critical / 100)
    return this.basePct.critical / 100 + fromRating
  }

  getVersatilityPct() {
    const fromRating = applyStatDR(
      this.ratings.versatility / this.conversionTable.versatility / 100
    )
    return this.basePct.versatility / 100 + fromRating
  }

  getMasteryPct() {
    const masteryPoints = applyStatDR(this.ratings.mastery / this.conversionTable.mastery / 100)
    const masteryPctFromRating = masteryPoints * this.masteryPointRating
    return this.basePct.mastery / 100 + masteryPctFromRating
  }
}
