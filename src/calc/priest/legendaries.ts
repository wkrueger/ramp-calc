import { Auras, DURATION_INFINITE } from "../constants/aurasConstants"
import type { AuraInfo } from "./auras"

const clarityOfMind: AuraInfo = {
  id: Auras.ClarityOfMind,
  duration: DURATION_INFINITE,
}

const thePenitentOne: AuraInfo = {
  id: Auras.ThePenitentOne,
  duration: DURATION_INFINITE,
}

export const legendaries = {
  [Auras.ClarityOfMind]: clarityOfMind,
  [Auras.ThePenitentOne]: thePenitentOne,
}
