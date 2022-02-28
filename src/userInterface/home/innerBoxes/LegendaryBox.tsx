import { Heading, SimpleGrid, Stack } from "@chakra-ui/react"
import clsx from "clsx"
import { Legendaries } from "../../../calc/constants/legendariesConstants"
import { legendariesInfo } from "../../../data/legendaries"
import { BasicEvent, createEvent } from "../../common/event"
import { WowIcon } from "../../common/WowIcon"

export interface LegendaryBoxProps {
  className?: string
  value: Legendaries[]
  onChange: (ev: BasicEvent<string[]>) => any
}

export function LegendaryBox({ className, value, onChange }: LegendaryBoxProps) {
  const handleClick = (code: string) => (ev: any) => {
    const active = value.includes(code as Legendaries)
    if (!active && value.length >= 2) return
    const toSend = active ? value.filter(x => x !== code) : [...value, code]
    onChange(
      createEvent({
        name: "legendaries",
        value: toSend,
      })
    )
  }

  return (
    <Stack className={clsx("legendaries-box", className)}>
      <Heading size="sm" as="h3">
        Legendaries
      </Heading>
      <SimpleGrid spacing={6} columns={4}>
        {legendariesInfo.map(leg => {
          return (
            <WowIcon
              className="clickable"
              isSelected={value.includes(leg.code)}
              key={leg.code}
              iconName={leg.icon}
              label={leg.label}
              onClick={handleClick(leg.code)}
            />
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}
