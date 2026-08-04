import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  TextArea,
  Text
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

/**
 * Encodes a UTF-8 string to base64.
 */
const encodeToBase64 = (value) => {
  if (!value) return '';
  return window.btoa(unescape(encodeURIComponent(value)));
}

/**
 * Decodes a base64 string back to UTF-8.
 * Falls back to the raw value if it isn't valid base64 (e.g. legacy
 * content saved before this field existed), so existing HTML isn't lost.
 */
const decodeFromBase64 = (value) => {
  if (!value) return '';
  try {
    return decodeURIComponent(escape(window.atob(value)));
  } catch (e) {
    return value;
  }
}

export default function HtmlContainerField () {
  const [guestConnection, setGuestConnection] = useState()
  const [htmlValue, setHtmlValue] = useState('');
  const [label, setLabel] = useState('HTML Code');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const model = await connection.host.field.getModel();

      if (model.label) {
        setLabel(model.label);
      }

      const storedValue = await connection.host.field.getValue() || '';

      setHtmlValue(decodeFromBase64(storedValue));
      setLoading(false);

      document.body.style.height = '300px';
    })()
  }, [])

  const handleChange = (newValue) => {
    setHtmlValue(newValue);
    guestConnection?.host.field.onChange(encodeToBase64(newValue));
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        <TextArea
          label={label}
          value={htmlValue}
          onChange={handleChange}
          isDisabled={loading}
          width="100%"
          height="size-2400"
          placeholder="Enter HTML code..."
        />
        <Text UNSAFE_style={{ display: 'block', marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
          Content is stored as base64-encoded HTML.
        </Text>
      </View>
    </Provider>
  )
}
