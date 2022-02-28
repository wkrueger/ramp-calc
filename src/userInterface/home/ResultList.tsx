import { Box, Heading, HStack, Spacer, Stack } from "@chakra-ui/layout"
import {
  Checkbox,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
} from "@chakra-ui/react"
import React, { useEffect, useState } from "react"
import { CalcResult, getEncounterState, getHealing } from "../../calc"
import { Auras } from "../../calc/constants/aurasConstants"
import { EventTime } from "../../calc/core/eventEffects"
import { Spells } from "../../calc/constants/spellsConstants"
import { Profile } from "./profileState"
import { numberFormat } from "../common/numberFormat"
import { useDebounce } from "../common/useDebounce"
import { WowIcon } from "../common/WowIcon"

type ResultsType = ({ type: "ok" } & CalcResult) | { type: "error"; error: any }

type MergedEvent = EventTime & { instances?: number }

function mergeEvents(lines: EventTime[]) {
  let out: MergedEvent[] = []
  let current: MergedEvent | null = null
  for (const line of lines) {
    if (!current) {
      current = line
      continue
    }
    if (
      line.time === current.time &&
      line.event.type === current.event.type &&
      (line.event.type === "dmg" || line.event.type === "heal") &&
      (current.event as any).spell === (line.event as any).spell
      // (current.event as any).value === (line.event as any).value
    ) {
      current = {
        ...current,
        event: {
          ...current.event,
          target: null,
          // value: (current.event as any).value + (line.event as any).value,
        },
        instances: (current.instances || 1) + 1,
      } as any
    } else {
      out.push(current)
      current = line
    }
  }
  if (current) {
    out.push(current)
  }
  return out
}

export function ResultList({
  profile,
  setProfile,
}: {
  profile: Profile
  setProfile: (cb: (p: Profile) => Profile) => any
}) {
  const logModal = useDisclosure()
  const throttledProfile = useDebounce(profile, 500)
  const [doMerge, setMerge] = useState(true)
  const [results, setResults] = useState(null as null | ResultsType)

  useEffect(() => {
    try {
      const state = getEncounterState({
        playerStatRatings: throttledProfile.stats,
        talents: throttledProfile.talents,
        conduits: throttledProfile.conduits as Auras[],
        hasTierSet: throttledProfile.enableTierSet,
      })
      setProfile(profile => {
        return {
          ...profile,
          availableSpells: state.getAvailableSpells().map(x => x.id),
        }
      })
      const calc = getHealing({
        state,
        spellsQueued: throttledProfile.spells as Spells[],
      })
      if (doMerge) {
        calc.log = mergeEvents(calc.log)
      }
      setResults({ type: "ok" as const, ...calc })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("calc err", err)
      setResults({ type: "error" as const, error: err })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    doMerge,
    setProfile,
    throttledProfile.spells,
    throttledProfile.stats,
    throttledProfile.talents,
    throttledProfile.conduits,
    throttledProfile.enableTierSet,
    throttledProfile.legendaries,
    // fixme: if I pass root profile it infinite loops
  ])

  const content = results ? (
    <>
      <HStack>
        {results.type === "ok" && (
          <>
            <Stat>
              <StatLabel>Healing</StatLabel>
              <StatNumber>{numberFormat(results.healing)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Time</StatLabel>
              <StatNumber>{results.time.toFixed(2)} s</StatNumber>
            </Stat>
            <WowIcon
              className="clickable"
              label="Combat Log"
              iconName="inv_inscription_parchmentvar05"
              onClick={logModal.onOpen}
            />
            <Spacer />
          </>
        )}
        {results.type === "error" && <Box>{String(results.error)}</Box>}
      </HStack>
      {/* combat log modal + table */}
      <Modal isOpen={logModal.isOpen} onClose={logModal.onClose} scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxWidth="unset">
          <ModalHeader display="flex" alignItems="flex-end">
            Combat Log
            <Checkbox
              isChecked={doMerge}
              ml={4}
              size="sm"
              onChange={ev => setMerge(ev.target.checked)}
            >
              Merge Events
            </Checkbox>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Time</Th>
                  <Th>Type</Th>
                  <Th>Name</Th>
                  <Th>Source</Th>
                  <Th>Target</Th>
                  <Th>Qty</Th>
                </Tr>
              </Thead>
              <Tbody>
                {results.type === "ok" &&
                  results.log.map((entry: MergedEvent) => {
                    const val1 = (entry.event as any).value
                    const val2 = (val1 ?? null) === null ? "" : numberFormat(val1)
                    const instances =
                      entry.instances && entry.instances > 1 ? ` (x ${entry.instances})` : ""
                    return (
                      <Tr key={entry.event.id}>
                        <Td>{entry.time.toFixed(2)}</Td>
                        <Td>{entry.event.type}</Td>
                        <Td>{getName(entry)}</Td>
                        <Td>{(entry.event as any).source || ""}</Td>
                        <Td>{(entry.event as any).target || ""}</Td>
                        <Td>
                          {val2}
                          {instances}
                        </Td>
                      </Tr>
                    )
                  })}
              </Tbody>
            </Table>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  ) : null

  return (
    <Stack className="box">
      <Heading size="sm" as="h3">
        Results
      </Heading>
      {content}
    </Stack>
  )
}

function getName(et: EventTime) {
  return (et.event as any).spell || (et.event as any).aura || ""
}
