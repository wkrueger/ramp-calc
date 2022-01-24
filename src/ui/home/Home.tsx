import { Badge, Center, Container, Divider, Heading, Stack } from "@chakra-ui/react"
import immer from "immer"
import React, { useCallback, useEffect, useState } from "react"
import { initialProfile, Profile } from "../../data/profile"
import useThrottle from "../common/useThrottle"
import { WithIndexSetter } from "../common/WIthIndexSetter"
import { ProfileBox } from "./ProfileBox/ProfileBox"

export function Home() {
  const [root, setRoot] = useState({
    idSeed: 0,
    profiles: [initialProfile],
  })
  const { profiles } = root

  const rootThrottle = useThrottle(root, 5000)

  useEffect(() => {
    try {
      const root = JSON.parse(localStorage.getItem("root") || "null")
      if (root) {
        setRoot(root)
      }
    } catch (err) {
      ///
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("root", JSON.stringify(rootThrottle))
    // eslint-disable-next-line no-console
    console.log("saved root")
  }, [rootThrottle])

  const setProfileAtIndex = useCallback((updatedProfile: Profile, index: number) => {
    setRoot(prevRoot => {
      return immer(prevRoot, draft => {
        draft.profiles[index] = updatedProfile
      })
    })
  }, [])

  return (
    <Container py="4" maxWidth="container.lg">
      <Center p="2">
        <Heading as="h1">
          ramp.calc
          <Badge verticalAlign="baseline">v1.0</Badge>
        </Heading>
      </Center>
      <Divider />
      <Stack className="profiles-list" my={4}>
        {profiles.map((profile, idx) => {
          return (
            <WithIndexSetter
              key={profile.id}
              Component={ProfileBox}
              index={idx}
              setter={setProfileAtIndex}
              value={profile}
              setterKey="setProfile"
              valueKey="profile"
            />
          )
        })}
      </Stack>
    </Container>
  )
}
