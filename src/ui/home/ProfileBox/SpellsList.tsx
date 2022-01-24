import {
  Box,
  CSSObject,
  Flex,
  Heading,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Select,
} from "@chakra-ui/react"
import clsx from "clsx"
import React, { useCallback, useMemo, useState } from "react"
import { Spell, spells } from "../../../calc/spells"
import { presets, presetsIdx } from "../../../data/presets"
import { Profile } from "../../../data/profile"
import { Affix, spellsWithAffix, WowIcon } from "../../common/WowIcon"
import { SpellsBox } from "./SpellsBox"

const containerStyles: CSSObject = {
  ".icon-wrap": {
    position: "relative",
  },
  ".insert-here::before": {
    display: "block",
    content: "''",
    position: "absolute",
    left: "-5px",
    width: "2px",
    height: "100%",
    backgroundColor: "rgba(250, 250, 140, 0.7)",
  },
  ".hoverfix": {
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    marginLeft: -1,
    paddingLeft: 1,
    marginRight: -1,
    paddingRight: 1,
    marginTop: -1,
    paddingTop: 1,
    borderRadius: "3px",
    cursor: "pointer",
    userSelect: "none",
  },
}

export function SpellsList({
  profile,
  setProfile,
}: {
  profile: Profile
  setProfile: (cb: (s: Profile) => Profile) => void
}) {
  const [currentPosition, setCurrentPosition] = useState(0)
  const [isSpellsPopoverOpen, setSpellsPopoverOpen] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState("boon-ev")

  const handlePresetChange = useCallback(
    ev => {
      const { value: code } = ev.target
      const found = presetsIdx[code]
      const toSet = found?.spells || []
      setSelectedPreset(code)
      setProfile(prev => {
        return { ...prev, spells: toSet }
      })
    },
    [setProfile]
  )

  const handleIconClick = useMemo(
    () => (index: number) => (ev: any) => {
      ev.stopPropagation()
      setCurrentPosition(index)
      setSpellsPopoverOpen(true)
    },
    [setSpellsPopoverOpen]
  )

  const handleRemove = useMemo(
    () => (index: number) => (ev: any) => {
      ev.preventDefault()
      setProfile(prev => {
        const updated = [...prev.spells.slice(0, index), ...prev.spells.slice(index + 1)]
        return { ...prev, spells: updated }
      })
    },
    [setProfile]
  )

  const handleSpellSelect = useCallback(
    (spell: Spell) => {
      const pos = currentPosition
      setProfile(prev => {
        const updated = [...prev.spells.slice(0, pos), spell.id, ...prev.spells.slice(pos)]
        return { ...prev, spells: updated }
      })
      setCurrentPosition(pos + 1)
    },
    [currentPosition, setProfile]
  )

  return (
    <Flex direction="column" className="box" sx={containerStyles} flexGrow={1}>
      <Box width="100%" position="relative" className="heading-group">
        <Heading size="sm" as="h3">
          Spells
        </Heading>
        <Select
          placeholder="Presets"
          position="absolute"
          top="-5px"
          right={0}
          width="auto"
          size="sm"
          value={selectedPreset}
          onChange={handlePresetChange}
        >
          {presets.map(preset => {
            return (
              <option key={preset.code} value={preset.code}>
                {preset.name}
              </option>
            )
          })}
        </Select>
      </Box>
      <Box flexDirection="column" className="spells-group">
        <Box height="6px" />
        <Popover
          isOpen={isSpellsPopoverOpen}
          onClose={() => setSpellsPopoverOpen(false)}
          isLazy
          placement="left"
        >
          <PopoverTrigger>
            <Box
              className="hoverfix"
              onClick={handleIconClick(profile.spells.length)}
              minHeight="2rem"
            >
              <Flex
                flexWrap="wrap"
                sx={{
                  "> *": { marginBottom: 2, marginRight: 2 },
                }}
              >
                {profile.spells.map((spellCode, idx) => {
                  const spellObj = spells[spellCode]
                  const hasAffix = spellsWithAffix[spellObj.id]
                  const affix = hasAffix ? Affix(hasAffix) : undefined
                  const isInsertHere = idx === currentPosition
                  return (
                    <div
                      key={spellCode + "-" + idx}
                      className={clsx(
                        "icon-wrap",
                        isInsertHere && isSpellsPopoverOpen && "insert-here"
                      )}
                      onClick={handleIconClick(idx)}
                      onContextMenu={handleRemove(idx)}
                    >
                      <WowIcon
                        className="clickable"
                        iconName={spellObj?.icon}
                        label={spellObj?.label || spellCode}
                        affix={affix}
                      />
                    </div>
                  )
                })}
              </Flex>
            </Box>
          </PopoverTrigger>
          <PopoverContent width="unset">
            <PopoverArrow />
            <PopoverBody>
              <SpellsBox
                availableSpells={profile.availableSpells}
                className="popover-dialog"
                onSelect={handleSpellSelect}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
    </Flex>
  )
}
