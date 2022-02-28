import { presetsIdx } from "../../data/presets"
import { Talents } from "../../data/talents"
import { getAllSpells } from "../../calc/priest/spells"
import { StatRatingsIn } from "../../calc"
import { Auras } from "../../calc/constants/aurasConstants"

const spells = getAllSpells()

export const initialProfile = {
  id: 1,
  profileName: "Profile Name",
  stats: {
    intellect: 1500,
    haste: 500,
    mastery: 500,
    critical: 500,
    versatility: 500,
  } as StatRatingsIn,
  covenant: "kyrian",
  talents: [
    Talents.Schism,
    Talents.Solace,
    Talents.SinsOfTheMany,
    Talents.PurgeTheWicked,
    Talents.Evangelism,
  ] as Talents[],
  conduits: ["courageous-ascension", "exaltation", "rabid-shadows"],
  spells: presetsIdx["boon-ev"].spells,
  availableSpells: Object.values(spells)
    .filter(x => !x.passive)
    .sort((a, b) => {
      if (a.label > b.label) return 1
      if (b.label > a.label) return -1
      return 0
    })
    .map(spell => spell.id),
  enableTierSet: true,
  legendaries: [] as Auras[],
}

export type Profile = typeof initialProfile
