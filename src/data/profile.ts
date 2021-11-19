import { StatRatingsIn } from "../calc/StatsHandler"
import { presetsIdx } from "./presets"

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
  talents: ["schism", "solace", "sins-of-the-many", "purge-the-wicked", "evangelism"],
  conduits: ["courageous-ascension", "exaltation", "rabid-shadows"],
  spells: presetsIdx["boon-ev"].spells,
}

export type Profile = typeof initialProfile
