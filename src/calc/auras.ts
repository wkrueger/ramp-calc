import { Time } from "./common"

export enum Auras {
  Atonement,
  Schism,
  Pain,
}

export interface Aura {
  id: Auras
  appliedAt: Time
  expiredAt: Time
}
