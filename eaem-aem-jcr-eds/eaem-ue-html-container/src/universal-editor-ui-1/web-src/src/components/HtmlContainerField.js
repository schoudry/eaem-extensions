import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  TextArea,
  Text,
  Button
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

      document.body.style.height = '650px';
    })()
  }, [])

  const handleChange = (newValue) => {
    setHtmlValue(newValue);
    guestConnection?.host.field.onChange(encodeToBase64(newValue));
  }

  // Opens a real, top-level popup window (centered on screen) instead of an
  // in-iframe modal, since this field renders inside the Universal Editor's
  // right-rail iframe and any in-iframe overlay would be confined to that
  // panel rather than the browser window.
  const openExpandedEditor = () => {
    const width = Math.min(1400, window.screen.availWidth - 40);
    const height = Math.min(1000, window.screen.availHeight - 40);
    const left = (window.screen.availWidth - width) / 2;
    const top = (window.screen.availHeight - height) / 2;

    // Popup is same-origin with this extension, so it can reach back here
    // directly via window.opener instead of needing postMessage plumbing.
    window.eaemHtmlContainerBridge = {
      label,
      value: htmlValue,
      onChange: handleChange,
    };

    const popup = window.open(
      `${window.location.origin}${window.location.pathname}#/eaem-html-container-editor`,
      'eaemHtmlContainerEditor',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      // eslint-disable-next-line no-alert
      alert('Please allow pop-ups for this site to expand the editor.');
    }
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        <Flex direction="column" gap="size-100">
          <TextArea
            label={label}
            value={htmlValue}
            onChange={handleChange}
            isDisabled={loading}
            width="100%"
            height="500px"
            placeholder="Enter HTML code..."
          />
          <Flex justifyContent="end">
            <Button variant="secondary" isDisabled={loading} onPress={openExpandedEditor}>Expand</Button>
          </Flex>
        </Flex>
        <Text UNSAFE_style={{ display: 'block', marginTop: '8px', fontSize: '11px', opacity: 0.7 }}>
          Content is stored as base64-encoded HTML.
        </Text>
      </View>
    </Provider>
  )
}
