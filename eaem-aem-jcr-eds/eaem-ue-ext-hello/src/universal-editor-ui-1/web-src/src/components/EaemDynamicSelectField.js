import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Content,
  ComboBox, Item
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()
  let [value, setValue] = useState(null);
  const [model, setModel] = useState(null);
  const fieldRef = useRef();

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const model = await connection.host.field.getModel();
      setModel(model);

      setValue(connection.host.field.getValue() || '');
    })()
  }, [])

  const handleSelectionChange = (newValue) => {
    setValue(newValue);
    guestConnection?.host.field.onChange(newValue);
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark'>
      <Content>
        <View padding='size-100'>
            <ComboBox selectedKey={value} onSelectionChange={handleSelectionChange} label="Root Folder">
                <Item key="one">One</Item>
                <Item key="two">Two</Item>
                <Item key="three">Three</Item>
            </ComboBox>
        </View>
      </Content>
    </Provider>
  )
}

