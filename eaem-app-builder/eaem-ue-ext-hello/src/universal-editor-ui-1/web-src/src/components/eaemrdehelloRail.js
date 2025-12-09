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

export default function eaemrdehelloRail () {
  // Fields
  const [guestConnection, setGuestConnection] = useState()

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })

      setGuestConnection(guestConnection)
    })()
  }, [])


  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      Insert rail content here
    </Provider>
  )
}
