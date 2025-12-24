import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import { EditorState } from "prosemirror-state";
import {
  Provider,
  defaultTheme,
  Button,
  TextArea,
  Flex,
  Text,
  View,
  Content,
  Checkbox,
  Heading
} from '@adobe/react-spectrum'

import { extensionId, RICHTEXT_TYPE, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants"

export default function EaemrdehelloRail () {
  const [guestConnection, setGuestConnection] = useState()

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      console.log('--EditorState ------>', EditorState );

    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='light' height='100vh'>
      <Content height='100%'>
        <View padding='size-200'>
          <Heading marginBottom='size-100' level='3'>Links in Richtext</Heading>
        </View>
      </Content>
    </Provider>
  )
}
