import keyBy from "lodash/keyBy"
import { Auras } from "../calc/constants/aurasConstants"

export const legendariesInfo = [
  {
    id: 336067,
    label: "Clarity of Mind",
    code: Auras.ClarityOfMind,
    icon: "spell_holy_spiritualguidence",
  },
  {
    id: 333011,
    label: "The Penitent One",
    code: Auras.ThePenitentOne,
    icon: "spell_holy_penance",
  },
  {
    id: 356392,
    label: "Shadow Word: Manipulation",
    code: Auras.ShadowWordManipulation,
    icon: "ability_revendreth_priest",
  },
  {
    id: 356395,
    label: "Spheres' Harmony",
    code: Auras.SpheresHarmony,
    icon: "ability_bastion_priest",
  },
]

export const legendariesInfoIdx = keyBy(legendariesInfo, "code")
