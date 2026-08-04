import React, { useState } from 'react'
import {
  Provider,
  defaultTheme,
  Flex,
  View,
  TextArea,
  Heading,
  Button,
  Text
} from '@adobe/react-spectrum'

/**
 * Rendered in a real popup window (opened via window.open from HtmlContainerField),
 * not an iframe, so it can be centered on the actual screen instead of being
 * confined to the Universal Editor right-rail panel.
 *
 * Talks back to the opener via a plain object left on window.opener, since the
 * popup is same-origin with the extension (both served from this app's host).
 */
export default function HtmlContainerModalEditor() {
  const bridge = window.opener && window.opener.eaemHtmlContainerBridge;
  const [value, setValue] = useState(bridge ? bridge.value : '');

  if (!bridge) {
    return (
      <Provider theme={defaultTheme} colorScheme="dark" height="100vh">
        <View padding="size-300">
          <Text>Unable to connect to the field editor. Please close this window and try again.</Text>
        </View>
      </Provider>
    )
  }

  const handleChange = (newValue) => {
    setValue(newValue);
    bridge.onChange(newValue);
  }

  return (
    <Provider theme={defaultTheme} colorScheme="dark" height="100vh">
      <Flex direction="column" height="100vh">
        <View paddingX="size-300" paddingTop="size-200" paddingBottom="size-100">
          <Flex justifyContent="space-between" alignItems="center">
            <Heading level={3} margin="size-0">{bridge.label}</Heading>
            <Button variant="cta" onPress={() => window.close()}>Done</Button>
          </Flex>
        </View>
        <View flexGrow={1} paddingX="size-300" paddingBottom="size-300">
          <TextArea
            aria-label={bridge.label}
            value={value}
            onChange={handleChange}
            width="100%"
            height="100%"
          />
        </View>
      </Flex>
    </Provider>
  )
}
