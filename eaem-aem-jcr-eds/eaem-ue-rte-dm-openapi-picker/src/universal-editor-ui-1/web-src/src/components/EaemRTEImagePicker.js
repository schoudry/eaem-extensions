import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  TextArea,
  Text,
  ActionButton,
  Button
} from '@adobe/react-spectrum'
import ImageSearch from '@spectrum-icons/workflow/ImageSearch'

import { extensionId, RICHTEXT_TYPE, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants"

export default function EaemRTEImagePicker () {
  const [guestConnection, setGuestConnection] = useState()
  const [aemToken, setAemToken] = useState('')
  const [currentEditable, setCurrentEditable] = useState({});
  const [editorState, setEditorState] = useState(null)
  const [textValue, setTextValue] = useState('')
  const [imageMarkers, setImageMarkers] = useState({})
  const currentMarkerRef = useRef(null)

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
  }

  const styleFieldArea = () => {
    document.body.style.height = '430px';
  }

  const updateRichtext = async (item, editorState, token) => {
    const payload = {
      connections: [{
        name: "aemconnection",
        protocol: "xwalk",
        uri: getAemHost(editorState)
      }],
      target: {
        prop: item.prop,
        resource: item.resource,
        type: item.type
      },
      value: item.content
    };

    try {
      const response = await fetch('https://universal-editor-service.adobe.io/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      return await response.json();
    } catch (error) {
      console.error('Error updating richtext:', error);
      throw error;
    }
  }

  const updateTextContent = (marker, linkUrl) => {
    // First remove anchor tag if it exists
    const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const anchorRegex = new RegExp(`<a[^>]*href="[^"]*"[^>]*>${escapedMarker}</a>`, 'g');
    let updatedTextValue = textValue.replace(anchorRegex, marker);
    
    // Then create new anchor tag if linkUrl is not empty
    if (linkUrl) {
      updatedTextValue = updatedTextValue.replace(marker, `<a href="${linkUrl}">${marker}</a>`);
    }
    
    return updatedTextValue;
  }

  const extractImageMarkers = (content) => {
    if (!content) return {};
    
    const regex = /\/\/External Image.*?\/\//g;
    const matches = content.match(regex) || [];
    const markersObj = {};
    
    matches.forEach(marker => {
      const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const anchorRegex = new RegExp(`<a[^>]*href="([^"]*)"[^>]*>${escapedMarker}</a>`, 'g');
      const anchorMatch = content.match(anchorRegex);
      
      if (anchorMatch) {
        // Extract href from the anchor tag
        const hrefMatch = anchorMatch[0].match(/href="([^"]*)"/);
        markersObj[marker] = hrefMatch ? hrefMatch[1] : '';
      } else {
        // Marker not wrapped in anchor tag
        markersObj[marker] = '';
      }
    });
    
    return markersObj;
  }

  const handleTextAreaChange = async (imageMarkers) => {
    let updatedTextValue = textValue;
    
    for (const marker of Object.keys(imageMarkers)) {
      const assetUrl = imageMarkers[marker];
      
      // First remove anchor tag if it exists
      const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const anchorRegex = new RegExp(`<a[^>]*href="[^"]*"[^>]*>${escapedMarker}</a>`, 'g');
      updatedTextValue = updatedTextValue.replace(anchorRegex, marker);
      
      // Then create new anchor tag if assetUrl is not empty
      if (assetUrl) {
        updatedTextValue = updatedTextValue.replace(marker, `<a href="${assetUrl}">${marker}</a>`);
      }
    }
    
    setTextValue(updatedTextValue);

    console.log("updatedTextValue-------->", updatedTextValue);
    
    return updatedTextValue;
  }

  const getCurrentEditable = (state) => {
    if (!state.selected) return null;
    const selectedId = Object.keys(state.selected).find(key => state.selected[key] === true) || null;

    if(selectedId && state.editables) {
      const editable = state.editables.find(item => item.id === selectedId);
      return editable || null;
    }
  }

  const initImageMarkers = (state) => {
    const currentEditable = getCurrentEditable(state);

    if (currentEditable) {
      setCurrentEditable(currentEditable);
      setTextValue( currentEditable.content || '');
      setImageMarkers(extractImageMarkers(currentEditable.content || '')  );
    }
  }

  const fillEditableResourceIfEmpty = () => {
    if(!currentEditable.resource) {
      // Extract resource from selector: [data-aue-resource="urn:aemconnection:/content/..."]
      const match = currentEditable.selector?.match(/data-aue-resource="([^"]+)"/);
      if (match) {
        currentEditable.resource = match[1];
      }
    }
  }

  const handleApplyAll = async () => {
    const updatedTextValue = await handleTextAreaChange(imageMarkers);

    currentEditable.content = updatedTextValue;

    fillEditableResourceIfEmpty();

    await updateRichtext(currentEditable, editorState, aemToken);

    await guestConnection.host.editorActions.refreshPage();

    initImageMarkers(editorState);
  };

  const showAssetSelectorModal = (marker) => {
    currentMarkerRef.current = marker;

    guestConnection.host.modal.showUrl({
        url: '/index.html#open-asset-picker-modal',
        width: '80vw',
        height: '70vh',
    });
  };

  useEffect(() => {
    (async () => {
      styleFieldArea();

      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const state = await connection.host.editorState.get();
      setEditorState(state);

      const aemToken = await connection.sharedContext.get("token");
      setAemToken(aemToken);

      initImageMarkers(state);

      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

      channel.onmessage = async (event) => {
        if (!event.data.type) {
          return;
        }

        if (event.data.type === 'EAEM_ASSET_PICKER_ASSET_SELECTED' && currentMarkerRef.current) {
          setImageMarkers(prev => ({
            ...prev,
            [currentMarkerRef.current]: event.data.assetUrl
          }));
          currentMarkerRef.current = null;
        } else {
          setImageMarkers(extractImageMarkers(event.data?.data?.value || '')  );
        }
  
        return () => {
          channel.close();
        };
      }
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        {Object.keys(imageMarkers).length === 0 ? (
          <Text>No image markers found, a sample is shown below...
            <br/><br/><span style={{fontStyle: 'italic'}}>This folowing image is picked from Dynamic Media Open API folder
            <br/><br/>//External Image 1//</span></Text>
        ) : (
          <Flex direction="column" gap="size-100">
            <Flex direction="row" justifyContent="space-between" alignItems="center" marginBottom="size-100">
              <Text UNSAFE_style={{ fontSize: '16px', fontWeight: 'bold' }}>Image Markers</Text>
              <Button variant="primary" onPress={handleApplyAll}>
                Apply
              </Button>
            </Flex>
            {Object.keys(imageMarkers).map((marker, index) => (
              <Flex key={index} direction="column" gap="size-100" marginBottom="size-200">
                <Text>{marker}</Text>
                <View UNSAFE_style={{ position: 'relative' }}>
                  <TextArea 
                    width="100%" 
                    value={imageMarkers[marker]}
                    onChange={(value) => setImageMarkers(prev => ({ ...prev, [marker]: value }))}
                  />
                  <ActionButton 
                    onPress={() => showAssetSelectorModal(marker)}
                    isQuiet
                    UNSAFE_style={{ position: 'absolute', bottom: '4px', right: '4px', cursor: 'pointer' }}>
                    <ImageSearch aria-label="Search Image" />
                  </ActionButton>
                </View>
              </Flex>
            ))}
          </Flex>
        )}
      </View>
    </Provider>
  )
}

