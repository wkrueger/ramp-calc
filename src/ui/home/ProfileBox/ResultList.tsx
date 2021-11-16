import { Box, Heading, HStack, Spacer, Stack } from "@chakra-ui/layout"
import {
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
import { CalcResult, getHealing } from "../../../calc"
import { EventTime } from "../../../calc/events"
import { Spells } from "../../../calc/spellsConstants"
import { numberFormat } from "../../common/numberFormat"
import { useDebounce } from "../../common/useDebounce"
import { WowIcon } from "../../common/WowIcon"
import { Profile } from "../../data/profile"

type ResultsType = ({ type: "ok" } & CalcResult) | { type: "error"; error: any }

export function ResultList({ profile }: { profile: Profile }) {
  const logModal = useDisclosure()
  const throttledProfile = useDebounce(profile, 500)
  const [results, setResults] = useState(null as null | ResultsType)
  useEffect(() => {
    try {
      const out = getHealing({
        spells: throttledProfile.spells as Spells[],
        playerStatRatings: throttledProfile.stats,
      })
      setResults({ type: "ok" as const, ...out })
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("calc err", err)
      setResults({ type: "error" as const, error: err })
    }
  }, [throttledProfile.spells, throttledProfile.stats])

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
          <ModalHeader>Combat Log</ModalHeader>
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
                  results.log.map(entry => {
                    const val1 = (entry.event as any).value
                    const val2 = (val1 ?? null) === null ? "" : numberFormat(val1)
                    return (
                      <Tr key={entry.event.id}>
                        <Td>{entry.time.toFixed(2)}</Td>
                        <Td>{entry.event.type}</Td>
                        <Td>{getName(entry)}</Td>
                        <Td>{(entry.event as any).source || ""}</Td>
                        <Td>{(entry.event as any).target || ""}</Td>
                        <Td>{val2}</Td>
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

function getSource(et: EventTime) {
  return (et.event as any).source || ""
}
