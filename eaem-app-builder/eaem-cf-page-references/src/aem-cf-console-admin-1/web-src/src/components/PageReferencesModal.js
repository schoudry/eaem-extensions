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


import { useParams } from "react-router-dom"

import { extensionId } from "./Constants"

export default function PageReferencesModal () {
  // Fields
  const [guestConnection, setGuestConnection] = useState()
  const GET_REFERENCES_URL = "/libs/dam/content/schemaeditors/forms/references/items/tabs/items/tab1/items/col1/items/local-references/items/references.html";
  
  const {fragmentId}  = useParams()
  
  if (!fragmentId) {
    console.error("fragmentId parameter is missing")
    return
  }

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })

      setGuestConnection(guestConnection)

      console.log("----->", guestConnection.sharedContext.get('aemHost'));

      /*fetch(GET_REFERENCES_URL + fragmentId)
          .then((response) => {
            console.log("----->", response);
          })*/
    })()
  })

  const onCloseHandler = () => {
    guestConnection.host.modal.close()
  }

  return (
    <Provider theme={defaultTheme} colorScheme='light'>
      <Content width="100%">
        <Text>Your modal content</Text>
        
        <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
          <ButtonGroup align="end">
            <Button variant="primary" onClick={onCloseHandler}>Close</Button>
          </ButtonGroup>
        </Flex>
      </Content>
    </Provider>
  )
}
