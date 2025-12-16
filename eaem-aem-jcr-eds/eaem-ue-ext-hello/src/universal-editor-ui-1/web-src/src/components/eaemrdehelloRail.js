import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
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
  const [editorState, setEditorState] = useState(null)

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

        const state = await connection.host.editorState.get();
        setEditorState(state);
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='light' height='100vh'>
      <Content height='100%'>
        <View padding='size-200'>
          <Heading marginBottom='size-100' level='3'>Links in Richtext</Heading>
          <View>
            {richtextItem?.id && (
              <Flex direction='column' gap='size-65' marginBottom='size-200' key={richtextItem.id}>
                <Flex direction='column'>
                  {itemLinks.length > 0 ? (
                    itemLinks.map((link, idx) => (
                      <Flex key={idx} direction='column' marginTop='size-100' marginBottom='size-100'>
                        <View borderWidth='thin' borderColor='gray-400' borderRadius='medium' padding='size-100' backgroundColor='gray-50'>
                          <Flex direction='column'>
                            <Text marginBottom='size-100'>
                              {link.text}
                            </Text>
                            <Checkbox isSelected={link.isOpenInNewTab} onChange={(isChecked) => handleLinkTargetChange(richtextItem.id, link.outerHTML, isChecked)}>
                              Open in new tab
                            </Checkbox>
                          </Flex>
                        </View>
                      </Flex>
                    ))
                  ) : (
                    <Text>No links found</Text>
                  )}
                  {itemLinks.length > 0 && (
                    <Flex direction='row' marginTop='size-100'>
                      <Button variant="primary" onPress={() => handleSave(richtextItem)} isDisabled={textValue === richtextItem.content} UNSAFE_style={{ cursor: "pointer" }}>Save</Button>
                    </Flex>
                  )}
                </Flex>
              </Flex>
            )}
          </View>
        </View>
      </Content>
    </Provider>
  )
}
