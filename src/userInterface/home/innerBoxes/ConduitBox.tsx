import { Stack, Heading, SimpleGrid } from "@chakra-ui/layout"
import clsx from "clsx"
import React, { useCallback } from "react"
import { BasicEvent, createEvent } from "../../common/event"
import { conduits } from "../../../data/conduits"
import { WowIcon } from "../../common/WowIcon"

export function ConduitBox({
  className,
  value,
  onChange,
}: {
  className?: string
  value: string[]
  onChange: (ev: BasicEvent<string[]>) => any
}) {
  const handleChange = useCallback(
    (code: string) => {
      return () => {
        const isEnabled = value.includes(code)
        if (isEnabled) {
          const valueOut = value.filter(x => x !== code)
          onChange(
            createEvent({
              name: "conduits",
              value: valueOut,
            })
          )
        } else {
          let out = [...value]
          if (value.length >= 3) {
            return
          }
          out.push(code)
          onChange(
            createEvent({
              name: "conduits",
              value: out,
            })
          )
        }
      }
    },
    [onChange, value]
  )

  return (
    <Stack className={clsx("conduits-box", className)}>
      <Heading size="sm" as="h3">
        Conduits
      </Heading>
      <SimpleGrid spacing={6} columns={3}>
        {conduits.map(conduit => {
          const isSelected = value.includes(conduit.code)
          return (
            <WowIcon
              className="clickable"
              key={conduit.code}
              iconName={conduit.icon}
              label={conduit.label}
              isSelected={isSelected}
              isDisabled={!isSelected}
              onClick={handleChange(conduit.code)}
            />
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}
