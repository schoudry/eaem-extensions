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
  const [textValue, setTextValue] = useState('')
  const [imageMarkers, setImageMarkers] = useState([])
  const [imageValues, setImageValues] = useState({})

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

  const extractMarkerKey = (marker) => {
    // Extract "External Image 1" from "//External Image 1//"
    return marker.replace(/^\/\//, '').replace(/\/\/$/, '');
  }

  const handleTextAreaChange = (marker, newValue) => {
    const key = extractMarkerKey(marker);
    setImageValues(prev => ({
      ...prev,
      [key]: newValue
    }));
  }

  const getCurrentEditable = (state) => {
    if (!state.selected) return null;
    const selectedId = Object.keys(state.selected).find(key => state.selected[key] === true) || null;

    if(selectedId && state.editables) {
      console.log('selectedId------', selectedId);
      const editable = state.editables.find(item => item.id === selectedId);
      return editable || null;
    }
  }

  useEffect(() => {
    (async () => {
      styleFieldArea();

      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const state = await connection.host.editorState.get();
      setEditorState(state);

      const model = await connection.host.field.getModel();
      const currentEditable = getCurrentEditable(state);

      if (currentEditable) {
        setTextValue( currentEditable.content || '');

        setImageMarkers(extractImageMarkers(currentEditable.content || '')  );
      }
    })()
  }, [])

  useEffect(() => {
    console.log('Collected Image Values----:', imageValues);
  }, [imageValues])

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        {imageMarkers.length === 0 ? (
          <Text>No image markers found, a sample is shown below..
            <br/><br/>This is //External Image 1// picked from Dynamic Media Open API folder
            <br/><br/>This is //External Image 2// picked from Experience Edge folder</Text>
        ) : (
          imageMarkers.map((marker, index) => (
            <Flex key={index} direction="column" gap="size-100" marginBottom="size-200">
              <Text>{marker}</Text>
              <TextArea 
                width="100%" 
                defaultValue={imageValues[extractMarkerKey(marker)] || ''}
                onBlur={(e) => handleTextAreaChange(marker, e.target.value)}
              />
            </Flex>
          ))
        )}
      </View>
    </Provider>
  )
}

