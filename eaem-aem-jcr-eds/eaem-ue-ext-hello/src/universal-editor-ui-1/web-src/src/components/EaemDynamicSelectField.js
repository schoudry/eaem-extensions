import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  TextArea,
  Text
} from '@adobe/react-spectrum'

import { extensionId, RICHTEXT_TYPE, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()
  let [value, setValue] = useState(null);
  const [editorState, setEditorState] = useState(null)
  const [richtextItem, setRichtextItem] = useState({})
  const [textValue, setTextValue] = useState('')
  const [imageMarkers, setImageMarkers] = useState([])

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
  }

  const extractImageMarkers = (content) => {
    if (!content) return [];
    
    const regex = /\/\/External Image.*?\/\//g;
    const matches = content.match(regex);
    
    return matches || [];
  }

  const styleFieldArea = () => {
    document.body.style.height = '400px';
  }

  useEffect(() => {
    (async () => {
      styleFieldArea();

      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

      channel.onmessage = async (event) => {
        if (!event.data.type) {
          return;
        }

        const state = await connection.host.editorState.get();
        setEditorState(state);

        if(event.data.type) {
          const resource = (event.data.type === EVENT_AUE_UI_SELECT) ? event.data.data.resource : event.data.data.request.target.resource;
          const item = state.editables.filter(editableItem => editableItem.resource === resource)[0];

          if (item) {
            if(!item.content && item.children && item.children.length > 0){
              //for custom blocks "richtext" is child of the custom block
              let child = state.editables.filter(editableItem => editableItem.id === item.children[0])[0];
              child.resource = item.resource;
              item = child;
            }

            setRichtextItem(item);

            setTextValue( item.content || '');
            
            setImageMarkers(extractImageMarkers(item.content || ''));
          }
        }
  
        return () => {
          channel.close();
        };
      };
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        {imageMarkers.map((marker, index) => (
          <Flex key={index} direction="column" gap="size-100" marginBottom="size-200">
            <Text>{marker}</Text>
            <TextArea width="100%" />
          </Flex>
        ))}
      </View>
    </Provider>
  )
}

