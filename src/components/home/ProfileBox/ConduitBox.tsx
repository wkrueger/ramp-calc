import { Stack, Heading, SimpleGrid } from "@chakra-ui/layout"
import React from "react"
import { conduits } from "../data/conduits"
import { WowIcon } from "../WowIcon"

export function ConduitBox() {
  return (
    <Stack className="box conduits-box">
      <Heading size="sm" as="h3">
        Conduits
      </Heading>
      <SimpleGrid spacing={4}>
        {conduits.map((conduit) => {
          return <WowIcon key={conduit.code} iconName={conduit.icon} label={conduit.label} />
        })}
      </SimpleGrid>
    </Stack>
  )
}
