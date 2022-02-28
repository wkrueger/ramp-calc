import { Heading, HStack, Stack } from "@chakra-ui/layout"
import React from "react"
import { BasicEvent, createEvent } from "../../common/event"
import { WowIcon } from "../../common/WowIcon"

export function CovenantBox({
  onChange,
  value,
  className,
}: {
  className?: string
  value: string
  onChange: (ev: BasicEvent) => void
}) {
  return (
    <Stack className={className}>
      <Heading size="sm" as="h3">
        Pick your covenant
      </Heading>
      <HStack spacing={6}>
        <WowIcon
          className="clickable"
          iconName="ui_sigil_venthyr"
          label="Venthyr"
          showLabel
          isSelected={value === "venthyr"}
          onClick={() => onChange(createEvent({ name: "covenant", value: "venthyr" }))}
        />
        <WowIcon
          className="clickable"
          iconName="ui_sigil_kyrian"
          label="Kyrian"
          showLabel
          isSelected={value === "kyrian"}
          onClick={() => onChange(createEvent({ name: "covenant", value: "kyrian" }))}
        />
      </HStack>
    </Stack>
  )
}
