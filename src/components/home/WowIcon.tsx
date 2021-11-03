import { Image } from "@chakra-ui/image"
import { Flex } from "@chakra-ui/layout"
import { CSSObject, Text } from "@chakra-ui/react"
import clsx from "clsx"
import React, { MouseEventHandler } from "react"

const styles: CSSObject = {
  textAlign: "center",
  img: {
    borderRadius: "3px",
  },
  "&.disabled img": {
    filter: "grayscale(100%) brightness(80%)",
  },
  "&.selected img": {
    boxShadow: "0 0 0 4px rgba(250, 250, 140, 0.7)",
  },
}

export function WowIcon(props: {
  iconName: string
  label: string
  onClick?: MouseEventHandler<any>
  showLabel?: boolean
  className?: string
  isDisabled?: boolean
  isSelected?: boolean
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
    </Flex>
  )
}
