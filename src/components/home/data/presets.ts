import _keyBy from "lodash/keyBy"

export const presets = [
  {
    code: "boon-ev",
    name: "Boon evangelism",
    // prettier-ignore
    spells: ['purge-the-wicked', 'purge-the-wicked' , 'rapture',
      'shield','shield','shield','shield','shield','shield',
      'shield','shield','shield','radiance','radiance',
      'evangelism','boon','ascended-blast','schism',
      'ascended-blast','ascended-nova','ascended-nova',
      'ascended-blast', 'ascended-nova','ascended-nova',
      'ascended-blast'
    ],
  },
]

export const presetsIdx = _keyBy(presets, "code")
