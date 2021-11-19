import { StatRatingsIn } from "../calc/StatsHandler"
import { presetsIdx } from "./presets"
import { Talents } from "./talents"

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
}

export type Profile = typeof initialProfile
