import { extendTheme, ThemeConfig } from "@chakra-ui/react"

export const theme = extendTheme({
  styles: {
    global: {
      h3: {
        marginBottom: 2,
      },
      ".clickable:hover": {
        filter: "brightness(120%)",
        backgroundColor: "rgba(0,0,0,0.05)",
        cursor: "pointer",
      },
      "#root .popover-dialog": {
        padding: 2,
      },
    },
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: true,
  } as ThemeConfig,
})
