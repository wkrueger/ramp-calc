import { Heading, SimpleGrid, Stack } from "@chakra-ui/layout"
import React, { memo } from "react"
import { Spell, spells } from "../../calc/priest/spells"
import { Spells } from "../../calc/constants/spellsConstants"
import { Affix, spellsWithAffix, WowIcon } from "../common/WowIcon"

export function SpellsBox_({
  availableSpells,
  className,
  onSelect,
}: {
  availableSpells: Spells[]
  className?: string
  onSelect: (spell: Spell) => any
}) {
  const spellsList = availableSpells.map(code => {
    return spells[code]
  })

  return (
    <Stack className={className}>
      <Heading size="sm" as="h3">
        Add spells
      </Heading>
      <SimpleGrid columns={5} spacing={4}>
        {spellsList.map(spellObj => {
          const hasAffix = spellsWithAffix[spellObj.id]
          const affix = hasAffix ? Affix(hasAffix) : undefined
          return (
            <WowIcon
              className="clickable"
              onClick={() => onSelect(spellObj)}
              key={spellObj.id}
              iconName={spellObj.icon}
              label={spellObj.label}
              affix={affix}
            />
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}

export const SpellsBox = memo(SpellsBox_)
