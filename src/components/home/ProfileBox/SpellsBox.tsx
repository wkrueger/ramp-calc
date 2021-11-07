import { Heading, SimpleGrid, Stack } from "@chakra-ui/layout";
import React from "react";
import { Spell, spells } from "../../../calc/spells";
import { Affix, spellsWithAffix, WowIcon } from "../WowIcon";

const spellsList = Object.values(spells).filter(x => !x.passive);

export function SpellsBox({
  className,
  onSelect,
}: {
  className?: string;
  onSelect: (spell: Spell) => any;
}) {
  return (
    <Stack className={className}>
      <Heading size="sm" as="h3">
        Add spells
      </Heading>
      <SimpleGrid columns={5} spacing={4}>
        {spellsList.map(spellObj => {
          const hasAffix = spellsWithAffix[spellObj.id];
          const affix = hasAffix ? Affix(hasAffix) : undefined;
          return (
            <WowIcon
              className="clickable"
              onClick={() => onSelect(spellObj)}
              key={spellObj.id}
              iconName={spellObj.icon}
              label={spellObj.label}
              affix={affix}
            />
          );
        })}
      </SimpleGrid>
    </Stack>
  );
}
