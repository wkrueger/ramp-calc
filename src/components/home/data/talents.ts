import _keyBy from "lodash/keyBy"
import _groupBy from "lodash/groupBy"

export const talents = [
  {
    id: 214621,
    label: "Schism",
    code: "schism",
    row: 1,
    icon: "spell_warlock_focusshadow",
  },
  {
    id: 193134,
    label: "Castigation",
    code: "castigation",
    row: 1,
    icon: "spell_holy_searinglightpriest",
  },
  {
    id: 265259,
    label: "Twist of Fate",
    code: "twist-of-fate",
    row: 1,
    icon: "spell_shadow_mindtwisting",
  },
  {
    id: 123040,
    label: "Mindbender",
    code: "mindbender",
    row: 3,
    icon: "spell_shadow_soulleech_3",
  },
  {
    id: 129250,
    label: "Power Word: Solace",
    code: "solace",
    row: 3,
    icon: "ability_priest_flashoflight",
  },
  {
    id: 280391,
    label: "Sins of the Many",
    code: "sins-of-the-many",
    row: 5,
    icon: "spell_holy_holyguidance",
  },
  {
    id: 197419,
    label: "Contrition",
    code: "contrition",
    row: 5,
    icon: "ability_priest_savinggrace",
  },
  {
    id: 314867,
    label: "Shadow Covenant",
    code: "shadow-covenant",
    row: 5,
    icon: "spell_shadow_summonvoidwalker",
  },
  {
    id: 204197,
    label: "Purge the Wicked",
    code: "purge-the-wicked",
    row: 6,
    icon: "ability_mage_firestarter",
  },
  {
    id: 110744,
    label: "Divine Star",
    code: "divine-star",
    row: 6,
    icon: "spell_priest_divinestar",
  },
  {
    id: 120517,
    label: "Halo",
    code: "halo",
    row: 6,
    icon: "ability_priest_halo",
  },
  {
    id: 109964,
    label: "Spirit Shell",
    code: "spirit-shell",
    row: 7,
    icon: "ability_shaman_astralshift",
  },
  {
    id: 246287,
    label: "Evangelism",
    code: "evangelism",
    row: 7,
    icon: "spell_holy_divineillumination",
  },
]

export const talentsIdx = _keyBy(talents, "code")

export const talentsByRow = _groupBy(talents, "row")
