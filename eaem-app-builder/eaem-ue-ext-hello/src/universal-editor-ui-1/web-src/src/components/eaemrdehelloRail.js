/*
 * <license header>
 */
 
import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Flex,
  Form,
  ProgressCircle,
  Provider,
  Content,
  defaultTheme,
  Text,
  TextField,
  ButtonGroup,
  Button,
  Heading,
  View
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemrdehelloRail () {
  const [guestConnection, setGuestConnection] = useState()

  const getRefParam = () => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('ref') || 'main'
  }

  const openPreviewPage = () => {
    const url = `https://${getRefParam()}--eaem-rde-eds-brand-seven--schoudry.aem.live/`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })

      setGuestConnection(guestConnection)
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='dark'>
      <div style={{ height: '905px',paddingTop: '20px' ,fontSize: '20px', textAlign: 'center' }}>
        <Button variant="primary" onPress={openPreviewPage} UNSAFE_style={{ cursor: 'pointer' }}>
          Open page in preview
        </Button>
      </div>
    </Provider>
  )
}
