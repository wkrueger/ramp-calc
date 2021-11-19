import _keyBy from "lodash/keyBy"
import _groupBy from "lodash/groupBy"

export enum Talents {
  Schism = "schism",
  Castigation = "castigation",
  TwistOfFate = "twist-of-fate",
  Mindbender = "mindbender",
  Solace = "solace",
  SinsOfTheMany = "sins-of-the-many",
  Contrition = "contrition",
  ShadowCovenant = "shadow-covenant",
  PurgeTheWicked = "purge-the-wicked",
  DivineStar = "divine-star",
  Halo = "halo",
  SpiritShell = "spirit-shell",
  Evangelism = "evangelism",
}

export const talents = [
  {
    id: 214621,
    label: "Schism",
    code: Talents.Schism,
    row: 1,
    icon: "spell_warlock_focusshadow",
  },
  {
    id: 193134,
    label: "Castigation",
    code: Talents.Castigation,
    row: 1,
    icon: "spell_holy_searinglightpriest",
  },
  {
    id: 265259,
    label: "Twist of Fate",
    code: Talents.TwistOfFate,
    row: 1,
    icon: "spell_shadow_mindtwisting",
  },
  {
    id: 123040,
    label: "Mindbender",
    code: Talents.Mindbender,
    row: 3,
    icon: "spell_shadow_soulleech_3",
  },
  {
    id: 129250,
    label: "Power Word: Solace",
    code: Talents.Solace,
    row: 3,
    icon: "ability_priest_flashoflight",
  },
  {
    id: 280391,
    label: "Sins of the Many",
    code: Talents.SinsOfTheMany,
    row: 5,
    icon: "spell_holy_holyguidance",
  },
  {
    id: 197419,
    label: "Contrition",
    code: Talents.Contrition,
    row: 5,
    icon: "ability_priest_savinggrace",
  },
  {
    id: 314867,
    label: "Shadow Covenant",
    code: Talents.ShadowCovenant,
    row: 5,
    icon: "spell_shadow_summonvoidwalker",
  },
  {
    id: 204197,
    label: "Purge the Wicked",
    code: Talents.PurgeTheWicked,
    row: 6,
    icon: "ability_mage_firestarter",
  },
  {
    id: 110744,
    label: "Divine Star",
    code: Talents.DivineStar,
    row: 6,
    icon: "spell_priest_divinestar",
  },
  {
    id: 120517,
    label: "Halo",
    code: Talents.Halo,
    row: 6,
    icon: "ability_priest_halo",
  },
  {
    id: 109964,
    label: "Spirit Shell",
    code: Talents.SpiritShell,
    row: 7,
    icon: "ability_shaman_astralshift",
  },
  {
    id: 246287,
    label: "Evangelism",
    code: Talents.Evangelism,
    row: 7,
    icon: "spell_holy_divineillumination",
  },
]

export type TalentInfo = typeof talents[0]

export const talentsIdx = _keyBy(talents, "code")

export const talentsByRow = _groupBy(talents, "row")
