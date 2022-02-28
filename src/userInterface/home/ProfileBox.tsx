import {
  CSSObject,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  Heading,
  HStack,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  Text,
} from "@chakra-ui/react"
import immer from "immer"
import _set from "lodash/set"
import React, { memo, useCallback, useMemo } from "react"
import { conduitsIdx } from "../../data/conduits"
import { covenants } from "../../data/covenants"
import { Profile } from "./profileState"
import { talentsIdx } from "../../data/talents"
import { BasicEvent } from "../common/event"
import { usePopupState } from "../common/usePopupState"
import { WowIcon } from "../common/WowIcon"
import { ConduitBox } from "./ConduitBox"
import { CovenantBox } from "./CovenantBox"
import { LegendaryBox } from "./innerBoxes/LegendaryBox"
import { ResultList } from "./ResultList"
import { SpellsList } from "./SpellsList"
import { TalentBox } from "./TalentBox"
import { legendariesInfoIdx } from "../../data/legendaries"

export const STATS_INFO = [
  { label: "Intellect", code: "intellect" },
  { label: "Haste", code: "haste" },
  { label: "Mastery", code: "mastery" },
  { label: "Critical", code: "critical" },
  { label: "Versatility", code: "versatility" },
]

const containerStyles: CSSObject = {
  ".popover-dialog": {
    padding: 4,
  },
  ".wowicon img": {
    width: "40px",
  },
  ".box": {
    backgroundColor: "rgba(0,0,0,0.1)",
    padding: 4,
    marginRight: 4,
  },
}

function ProfileBox_({
  profile,
  setProfile,
}: {
  profile: Profile
  setProfile: (cb: (s: Profile) => Profile) => void
}) {
  const [isCovenantPopupOpen, setCovenantPopupOpen] = usePopupState()
  const [isTalentPopupOpen, setTalentPopupOpen] = usePopupState()
  const [isConduitPopupOpen, setConduitPopupOpen] = usePopupState()
  const [isLegendaryPopupOpen, setLegendaryPopupOpen] = usePopupState()

  const setProfileName = useCallback(
    (nextName: string) => {
      setProfile(profile => {
        return { ...profile, profileName: nextName }
      })
    },
    [setProfile]
  )

  const genericChangeProfile = useCallback(
    ev => {
      const { name, value } = ev.target
      setProfile(prev => {
        return immer(prev, draft => {
          _set(draft, name, value)
        })
      })
    },
    [setProfile]
  )

  const setAndClosePopups = useMemo(() => {
    return (setter: (s: boolean) => void) => (ev: BasicEvent) => {
      setter(false)
      genericChangeProfile(ev)
    }
  }, [genericChangeProfile])

  const toggleTierSet = useCallback(() => {
    setProfile(profile => {
      return {
        ...profile,
        enableTierSet: !profile.enableTierSet,
      }
    })
  }, [setProfile])

  const covenantObject = covenants.find(c => c.code === profile.covenant)!

  return (
    <Flex direction="column" backgroundColor="rgba(255,255,255,0.1)" p={4} borderRadius="4px">
      <Flex className="profile-1st-row" width="100%">
        <Heading size="md">
          <Editable value={profile.profileName} onChange={setProfileName}>
            <EditablePreview />
            <EditableInput />
          </Editable>
        </Heading>
        {/* <Spacer />
        <Button ml={2}>Load from SIMC...</Button>
        <Button ml={2}>Inspect/replace gear...</Button> */}
      </Flex>
      <Flex className="profile-2nd-row" width="100%" pt={4} spacing={8} sx={containerStyles}>
        <div className="column">
          {/* stats */}
          <Stack className="box stats-box">
            <Heading size="sm" as="h3">
              Stats
            </Heading>
            <Stack>
              {STATS_INFO.map(statInfo => {
                return (
                  <HStack key={statInfo.code}>
                    <Input
                      width="8ch"
                      textAlign="right"
                      name={`stats.${statInfo.code}`}
                      value={(profile.stats as any)[statInfo.code]}
                      onChange={genericChangeProfile}
                    />
                    <Text flexGrow={1}>{statInfo.label}</Text>
                  </HStack>
                )
              })}
            </Stack>
          </Stack>
        </div>

        <Flex direction="column" className="column">
          {/* covenants */}
          <Popover
            isOpen={isCovenantPopupOpen}
            onClose={() => setCovenantPopupOpen(false)}
            isLazy
            placement="right-start"
          >
            <PopoverTrigger>
              <Stack
                className="box clickable"
                alignItems="flex-start"
                onClick={() => setCovenantPopupOpen(true)}
              >
                <Heading size="sm" as="h3">
                  Covenant
                </Heading>
                <WowIcon
                  iconName={covenantObject.icon}
                  label={covenantObject.label}
                  showLabel
                ></WowIcon>
              </Stack>
            </PopoverTrigger>
            <PopoverContent width="unset">
              <PopoverArrow />
              <PopoverBody>
                <CovenantBox
                  className="popover-dialog"
                  value={profile.covenant}
                  onChange={setAndClosePopups(setCovenantPopupOpen)}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>

          {/* legendaries */}
          <Popover
            isOpen={isLegendaryPopupOpen}
            onClose={() => setLegendaryPopupOpen(false)}
            isLazy
            placement="right-start"
          >
            <PopoverTrigger>
              <Stack
                className="box clickable"
                mt={2}
                alignItems="flex-start"
                onClick={() => setLegendaryPopupOpen(true)}
              >
                <Heading size="sm" as="h3">
                  Legendaries
                </Heading>
                {profile.legendaries.map(legCode => {
                  const legObj = legendariesInfoIdx[legCode]
                  return <WowIcon iconName={legObj.icon} label={legObj.label} key={legObj.code} />
                })}
                {!profile.legendaries.length && (
                  <WowIcon
                    iconName="ui-emptyslot-disabled"
                    extension=".png"
                    label="Pick a legendary"
                  />
                )}
              </Stack>
            </PopoverTrigger>
            <PopoverContent width="unset">
              <PopoverArrow />
              <PopoverBody>
                <LegendaryBox
                  className="popover-dialog"
                  value={profile.legendaries}
                  onChange={genericChangeProfile}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>

        {/* talents */}

        <div className="column">
          <Popover
            isOpen={isTalentPopupOpen}
            onClose={() => setTalentPopupOpen(false)}
            isLazy
            placement="right-start"
          >
            <PopoverTrigger>
              <Stack
                className="box clickable"
                alignItems="flex-start"
                onClick={() => setTalentPopupOpen(true)}
              >
                <Heading size="sm" as="h3">
                  Talents
                </Heading>
                {profile.talents.map(talentCode => {
                  const talentObj = talentsIdx[talentCode]
                  return (
                    <WowIcon
                      key={talentObj.code}
                      iconName={talentObj.icon}
                      label={talentObj.label}
                    />
                  )
                })}
              </Stack>
            </PopoverTrigger>
            <PopoverContent width="unset">
              <PopoverArrow />
              <PopoverBody>
                <TalentBox
                  className="popover-dialog"
                  value={profile.talents}
                  onChange={genericChangeProfile}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </div>

        <Flex direction="column" className="column">
          {/* conduits */}
          <Popover
            isOpen={isConduitPopupOpen}
            onClose={() => setConduitPopupOpen(false)}
            isLazy
            placement="right-start"
          >
            <PopoverTrigger>
              <Stack
                className="box clickable"
                alignItems="flex-start"
                onClick={() => setConduitPopupOpen(true)}
              >
                <Heading size="sm" as="h3">
                  Conduits
                </Heading>
                {profile.conduits.map(conduitCode => {
                  const conduitObj = conduitsIdx[conduitCode]!
                  return (
                    <WowIcon
                      iconName={conduitObj.icon}
                      label={conduitObj.label}
                      key={conduitObj.code}
                    />
                  )
                })}
              </Stack>
            </PopoverTrigger>
            <PopoverContent width="unset">
              <PopoverArrow />
              <PopoverBody>
                <ConduitBox
                  className="popover-dialog"
                  value={profile.conduits}
                  onChange={genericChangeProfile}
                />
              </PopoverBody>
            </PopoverContent>
          </Popover>
          {/* tier set */}
          <Stack className="box" marginTop={2} alignItems="flex-start">
            <Heading size="sm" as="h3">
              Tier set
            </Heading>

            <WowIcon
              className="clickable"
              iconName="ability_priest_innerlightandshadow"
              label="Til Dawn (4p)"
              isSelected={profile.enableTierSet}
              isDisabled={!profile.enableTierSet}
              onClick={toggleTierSet}
            />
          </Stack>
        </Flex>

        {/* last column */}
        <Flex
          direction="column"
          className="column"
          flexGrow={1}
          marginRight={0}
          sx={{
            ">.box": { marginRight: 0, marginBottom: 2 },
            ">.box:last-child": { marginBottom: 0 },
          }}
        >
          {/* spells */}
          <SpellsList profile={profile} setProfile={setProfile} />
          {/* result */}
          <ResultList profile={profile} setProfile={setProfile} />
        </Flex>
      </Flex>
    </Flex>
  )
}

export const ProfileBox = memo(ProfileBox_)
