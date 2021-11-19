import { Flex, Heading, SimpleGrid, Stack } from "@chakra-ui/layout"
import clsx from "clsx"
import React, { useCallback, useMemo } from "react"
import { BasicEvent, createEvent } from "../../common/event"
import { talents, talentsByRow, talentsIdx } from "../../../data/talents"
import { WowIcon } from "../../common/WowIcon"
import _keyBy from "lodash/keyBy"

export function TalentBox({
  className,
  value,
  onChange,
}: {
  className?: string
  value: string[]
  onChange: (ev: BasicEvent) => any
}) {
  const talentObjs = useMemo(() => {
    return value.map(v => talentsIdx[v]!)
  }, [value])

  const handleChange = useCallback(
    (code: string) => () => {
      const byRow = _keyBy(talentObjs, "row")
      const toSetObj = talentsIdx[code]!
      byRow[toSetObj.row] = toSetObj
      const newValues = Object.values(byRow).map(x => x.code)
      const toSend = createEvent({
        name: "talents",
        value: newValues,
      })
      onChange(toSend)
    },
    [onChange, talentObjs]
  )

  return (
    <Stack className={clsx("talent-box", className)}>
      <Heading size="sm" as="h3">
        Choose your talents
      </Heading>
      {Object.values(talentsByRow).map((row, idx) => {
        return (
          <SimpleGrid key={idx} columns={3} style={{ marginBottom: "1rem" }} spacing={4}>
            {row.map(talent => {
              const selected = value.includes(talent.code)
              return (
                <WowIcon
                  className="clickable"
                  key={talent.code}
                  iconName={talent.icon}
                  label={talent.label}
                  isSelected={selected}
                  isDisabled={!selected}
                  onClick={handleChange(talent.code)}
                />
              )
            })}
          </SimpleGrid>
        )
      })}
    </Stack>
  )
}
