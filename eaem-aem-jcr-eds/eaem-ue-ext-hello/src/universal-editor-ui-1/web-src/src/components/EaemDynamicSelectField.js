import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Content,
  ListView, Item
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()
  const [colorScheme, setColorScheme] = useState('dark');

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme}>
      <Content>
        <View padding='size-100'>
            <ListView
                selectionMode="single"
                aria-label="Eaem items example"
                maxWidth="size-6000"
                >
                <Item>Adobe Photoshop</Item>
                <Item>Adobe InDesign</Item>
                <Item>Adobe AfterEffects</Item>
                <Item>Adobe Illustrator</Item>
                <Item>Adobe Lightroom</Item>
            </ListView>
        </View>
      </Content>
    </Provider>
  )
}

