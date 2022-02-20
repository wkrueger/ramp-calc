import type { AuraInfo } from "./auras"
import { Auras, DURATION_INFINITE } from "./constants/aurasConstants"
import { Spells } from "./constants/spellsConstants"
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
    return new Map([[Spells.SpiritShellHeal, ssMult]])
  },
}

const RabidShadows: AuraInfo = {
  id: Auras.RabidShadows,
  duration: DURATION_INFINITE,
}

const shiningRadianceMult = new MultCalc({
  200: 56,
  213: 60,
  226: 64,
  239: 68,
  252: 72,
  265: 76,
  278: 80,
})

const ShiningRadiance: AuraInfo = {
  id: Auras.ShiningRadiance,
  duration: DURATION_INFINITE,
  healingMultiplier: ({ aura }) => {
    const mult = 1 + shiningRadianceMult.calc(aura.level!) / 100
    return new Map([[Spells.Radiance, mult]])
  },
}

export const swiftPenitenceMult = new MultCalc({
  200: 42,
  213: 45,
  226: 48,
  239: 51,
  252: 54,
  265: 57,
  278: 60,
})

const SwiftPenitence: AuraInfo = {
  id: Auras.SwiftPenitence,
  duration: DURATION_INFINITE,
}

export const conduits = {
  [Auras.CourageousAscension]: CourageousAscension,
  [Auras.Exaltation]: Exaltation,
  [Auras.RabidShadows]: RabidShadows,
  [Auras.ShiningRadiance]: ShiningRadiance,
  [Auras.SwiftPenitence]: SwiftPenitence,
}
