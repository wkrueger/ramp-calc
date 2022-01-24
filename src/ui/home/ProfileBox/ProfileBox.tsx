import {
  Button,
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
  Spacer,
  Stack,
  Text,
} from "@chakra-ui/react"
import immer from "immer"
import _set from "lodash/set"
import React, { memo, useCallback, useMemo } from "react"
import { BasicEvent } from "../../common/event"
import { usePopupState } from "../../common/usePopupState"
import { conduitsIdx } from "../../../data/conduits"
import { covenants } from "../../../data/covenants"
import { Profile } from "../../../data/profile"
import { talentsIdx } from "../../../data/talents"
import { WowIcon } from "../../common/WowIcon"
import { ConduitBox } from "./ConduitBox"
import { CovenantBox } from "./CovenantBox"
import { SpellsList } from "./SpellsList"
import { TalentBox } from "./TalentBox"
import { ResultList } from "./ResultList"

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
    ":last-child": {
      marginRight: 0,
    },
  },
}

function ProfileBoxRaw({
  profile,
  setProfile,
}: {
  profile: Profile
  setProfile: (cb: (s: Profile) => Profile) => void
}) {
  const [isCovenantPopupOpen, setCovenantPopupOpen] = usePopupState()
  const [isTalentPopupOpen, setTalentPopupOpen] = usePopupState()
  const [isConduitPopupOpen, setConduitPopupOpen] = usePopupState()

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
        <Spacer />
        <Button ml={2}>Load from SIMC...</Button>
        <Button ml={2}>Inspect/replace gear...</Button>
      </Flex>
      <Flex className="profile-2nd-row" width="100%" pt={4} spacing={8} sx={containerStyles}>
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

        {/* talents */}
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
                  <WowIcon key={talentObj.code} iconName={talentObj.icon} label={talentObj.label} />
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

        {/* last column */}
        <Flex
          direction="column"
          flexGrow={1}
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

export const ProfileBox = memo(ProfileBoxRaw)
