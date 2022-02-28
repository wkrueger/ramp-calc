import keyBy from 'lodash/keyBy'
import { Legendaries } from "../calc/constants/legendariesConstants";

export const legendariesInfo = [
  {
    id: 336067,
    label: 'Clarity of Mind',
    code: Legendaries.ClarityOfMind,
    icon: 'spell_holy_spiritualguidence',
  },
  {
   id: 333011,
   label: 'The Penitent One' ,
   code: Legendaries.ThePenitentOne,
   icon: 'spell_holy_penance'
  },
  {
    id: 356392,
    label: 'Shadow Word: Manipulation',
    code: Legendaries.ShadowWordManipulation,
    icon: 'ability_revendreth_priest'
  },
  {
    id: 356395,
    label: "Spheres' Harmony",
    code: Legendaries.SpheresHarmony,
    icon: 'ability_bastion_priest'
  }
]

export const legendariesInfoIdx = keyBy(legendariesInfo, 'code')