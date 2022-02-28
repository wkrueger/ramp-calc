import { Badge, Center, Container, Divider, Heading, Stack } from "@chakra-ui/react"
import immer from "immer"
import React, { useCallback, useEffect, useState } from "react"
import { initialProfile } from "./profileState"
import useThrottle from "../common/useThrottle"
import { IndexSetter, WithIndexSetter } from "../common/WIthIndexSetter"
import { ProfileBox } from "./ProfileBox"

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

  const setProfileAtIndex: IndexSetter<any> = useCallback((index: number, getNewValue) => {
    setRoot(prevRoot => {
      const newValue = getNewValue(prevRoot.profiles[index])
      return immer(prevRoot, draft => {
        draft.profiles[index] = newValue
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
              setterProp="setProfile"
              valueProp="profile"
            />
          )
        })}
      </Stack>
    </Container>
  )
}
