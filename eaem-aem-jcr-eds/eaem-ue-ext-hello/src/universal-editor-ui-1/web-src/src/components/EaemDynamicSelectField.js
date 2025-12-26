import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Text
} from '@adobe/react-spectrum'

import { extensionId, RICHTEXT_TYPE, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
  }

  const styleFieldArea = () => {
    document.body.style.height = '430px';
  }

  useEffect(() => {
    (async () => {
      styleFieldArea();

      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
          <Text>Quick Sample</Text>
      </View>
    </Provider>
  )
}

