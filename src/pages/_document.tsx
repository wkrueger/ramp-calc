import { ColorModeScript } from "@chakra-ui/react"
// eslint-disable-next-line @next/next/no-document-import-in-page
import Document, { Html, Head, Main, NextScript } from "next/document"
import { theme } from "../theme/theme"

export default class CustomDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head />
        <body id="root">
          {/* 👇 Here's the script */}
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
