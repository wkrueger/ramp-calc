import Icon from "@chakra-ui/icon"
import { Image } from "@chakra-ui/image"
import { Flex } from "@chakra-ui/layout"
import { CSSObject, Text } from "@chakra-ui/react"
import clsx from "clsx"
import { default as React, MouseEventHandler } from "react"
import { IconType } from "react-icons"
import { FaHeart } from "react-icons/fa"
import { GiBroadsword } from "react-icons/gi"
import { Spells } from "../../calc/constants/spellsConstants"

const styles: CSSObject = {
  textAlign: "center",
  position: "relative",
  "img.wowicon": {
    borderRadius: "3px",
  },
  "&.disabled img": {
    filter: "grayscale(100%) brightness(80%)",
  },
  "&.selected img": {
    boxShadow: "0 0 0 4px rgba(250, 250, 140, 0.7)",
  },
  ".affix": {
    position: "absolute",
    bottom: 0,
    right: 0,
  },
}

export function Affix(icon: any) {
  return function AffixIcon(props: { className: string }) {
    return <Icon className={props.className} as={icon} />
  }
}

export const spellsWithAffix: Record<string, IconType> = {
  [Spells.PenanceEnemy]: GiBroadsword,
  [Spells.PenanceFriendly]: FaHeart,
}

export function WowIcon(props: {
  iconName: string
  label: string
  onClick?: MouseEventHandler<any>
  showLabel?: boolean
  className?: string
  isDisabled?: boolean
  isSelected?: boolean
  affix?: (p: { className: string }) => JSX.Element
}) {
  return (
    <Flex
      className={clsx(
        "wowicon root",
        props.isSelected && "selected",
        props.isDisabled && "disabled"
      )}
      flexDirection="column"
      alignItems="center"
      sx={styles}
    >
      <Image
        title={props.label}
        className={clsx(props.className, "wowicon")}
        onClick={props.onClick}
        src={`wow-icons/${props.iconName}.jpg`}
        alt={props.label}
      />
      {props.showLabel && <Text mt={1}>{props.label}</Text>}
      {props.affix ? <props.affix className="affix" /> : undefined}
    </Flex>
  )
}
