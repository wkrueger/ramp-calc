import { StatRatingsIn } from "./player"

export enum Auras {
  Atonement = "atonement",
  Schism = "schism-aura",
  Pain = "pain-aura",
}

export interface Aura {
  id: Auras
  caster: string
  eventReference: number
  appliedAt: number
  expiredAt: number
}

export interface AuraInfo {
  id: Auras
  duration: number
  dot?: {
    interval: number
    getDoTDamage: (stats: StatRatingsIn) => number
  }
}

const Pain: AuraInfo = {
  id: Auras.Pain,
  duration: 12,
  dot: {
    interval: 2,
    getDoTDamage(stats) {
      return 0.57528 * stats.intellect
    },
  },
}

const Atonement: AuraInfo = {
  id: Auras.Atonement,
  duration: 12,
}

export const auras: Partial<Record<Auras, AuraInfo>> = {
  [Auras.Pain]: Pain,
  [Auras.Atonement]: Atonement,
}
