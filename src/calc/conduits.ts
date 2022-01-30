import type { AuraInfo } from "./auras"
import { Auras, DURATION_INFINITE } from "./aurasConstants"
import { Spells } from "./spellsConstants"

const ascensionK = (27.5 - 25) / (158 - 145)

const CourageousAscension: AuraInfo = {
  id: Auras.CourageousAscension,
  duration: DURATION_INFINITE,
  damageMultiplier: ({ aura }) => {
    const mult = 1 + (25 + ascensionK * (aura.level! - 145)) / 100
    return new Map([[Spells.AscendedBlast, mult]] as any)
  },
}

export const conduits = {
  [Auras.CourageousAscension]: CourageousAscension,
}
