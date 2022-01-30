import type { AuraInfo } from "./auras"
import { Auras, DURATION_INFINITE } from "./aurasConstants"
import { Spells } from "./spellsConstants"
import { MultCalc } from "./utl/conduitScale"

const ascensionMult = new MultCalc({
  200: 35,
  213: 37.5,
  226: 40,
  239: 42.5,
  252: 45,
  265: 47.5,
  278: 50,
})

const CourageousAscension: AuraInfo = {
  id: Auras.CourageousAscension,
  duration: DURATION_INFINITE,
  damageMultiplier: ({ aura }) => {
    const mult = 1 + ascensionMult.calc(aura.level!) / 100
    return new Map([[Spells.AscendedBlast, mult]] as any)
  },
}

const exaltationMult = new MultCalc({
  200: 7,
  213: 7.5,
  226: 8,
  239: 8.5,
  252: 9,
  265: 9.5,
  278: 10,
})

const Exaltation: AuraInfo = {
  id: Auras.Exaltation,
  duration: DURATION_INFINITE,
  healingMultiplier: ({ aura }) => {
    const ssMult = 1 + exaltationMult.calc(aura.level!) / 100
    return new Map([[Spells.SpiritShellHeal, ssMult]] as any)
  },
}

export const conduits = {
  [Auras.CourageousAscension]: CourageousAscension,
  [Auras.Exaltation]: Exaltation,
}
