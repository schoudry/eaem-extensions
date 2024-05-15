import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import { Flex, Provider, Content, defaultTheme, Text, ButtonGroup, Button } from '@adobe/react-spectrum'
import { useParams } from "react-router-dom"
import { extensionId } from "./Constants"

export default function PageReferencesModal () {
  const GET_REFERENCES_URL = "/libs/dam/content/schemaeditors/forms/references/items/tabs/items/tab1/items/col1/items/local-references/items/references.html";
  const [guestConnection, setGuestConnection] = useState()
  const [references, setReferences] = useState("Loading...");

  const {fragmentId}  = useParams()
  
  if (!fragmentId) {
    console.error("fragmentId parameter is missing")
    return
  }

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })

      setGuestConnection(guestConnection)

      const sharedContext = guestConnection.sharedContext,
            auth = sharedContext.get('auth');

      const baseUrl = `https://${sharedContext.get('aemHost')}${GET_REFERENCES_URL}${fragmentId}`;

      const requestOptions = {
        method: 'GET',
        headers: new Headers({
          'Authorization': `Bearer ${auth['imsToken']}`,
        })
      };

      const res = await fetch(baseUrl,requestOptions);

      if (res.ok) {
        setReferences(await res.text());
      }else{
        setReferences("Error loading references");
      }
    })()
  })

  const onCloseHandler = () => {
    guestConnection.host.modal.close()
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark'>
      <Content width="100%">
        <Text>{references}</Text>
        <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
          <ButtonGroup align="end">
            <Button variant="primary" onClick={onCloseHandler}>Close</Button>
          </ButtonGroup>
        </Flex>
      </Content>
    </Provider>
  )
}
