import {
  Badge,
  Center,
  Container,
  Divider,
  Heading,
  Stack,
} from "@chakra-ui/react";
import React, { memo, useCallback, useState } from "react";
import immer from "immer";
import { WithIndexSetter } from "../common/WIthIndexSetter";
import { ProfileBox } from "./ProfileBox/ProfileBox";
import { initialProfile, Profile } from "../data/profile";

export const STATS_INFO = [
  { label: "Intellect", code: "intellect" },
  { label: "Haste", code: "haste" },
  { label: "Mastery", code: "mastery" },
  { label: "Critical", code: "critical" },
  { label: "Versatility", code: "versatility" },
];

const ProfileMemo = memo(ProfileBox);

export function Home() {
  const [root, setRoot] = useState({
    idSeed: 0,
    profiles: [initialProfile],
  });
  const { profiles } = root;

  const setProfileAtIndex = useCallback(
    (updatedProfile: Profile, index: number) => {
      setRoot(prevRoot => {
        return immer(prevRoot, draft => {
          draft.profiles[index] = updatedProfile;
        });
      });
    },
    []
  );

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
              Component={ProfileMemo}
              index={idx}
              setter={setProfileAtIndex}
              value={profile}
              setterKey="setProfile"
              valueKey="profile"
            />
          );
        })}
      </Stack>
    </Container>
  );
}
