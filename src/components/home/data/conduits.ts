import _keyBy from "lodash/keyBy"

export const conduits = [
  {
    // 45%
    id: 337966,
    label: "Courageous Ascension",
    code: "courageous-ascension",
    icon: "spell_animabastion_wave",
    covenant: "kyrian",
  },
  {
    id: 337790,
    label: "Exaltation",
    code: "exaltation",
    icon: "spell_holy_spiritualguidence",
  },
  {
    // 34.2%
    id: 338338,
    label: "Rabid Shadows",
    code: "rabid-shadows",
    icon: "spell_deathknight_gnaw_ghoul",
  },
  {
    // 72 %
    id: 337778,
    label: "Shining Radiance",
    code: "shining-radiance",
    icon: "ability_priest_spiritoftheredeemer",
  },
  {
    id: 337891,
    label: "Swift Penitence",
    code: "swift-penitence",
    icon: "spell_holy_purify",
  },
]

export const conduitsIdx = _keyBy(conduits, "code")
