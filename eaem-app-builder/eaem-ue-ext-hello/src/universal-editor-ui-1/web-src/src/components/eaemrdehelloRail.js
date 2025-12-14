/*
 * <license header>
 */
 
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
  Divider,
  Heading
} from '@adobe/react-spectrum'

import { extensionId, RICHTEXT_TYPE } from "./Constants"

export default function EaemrdehelloRail () {
  const [guestConnection, setGuestConnection] = useState()
  const [richtextItems, setRichtextItems] = useState([])
  const [editorState, setEditorState] = useState(null)
  const [textValues, setTextValues] = useState({})
  const [pageUrl, setPageUrl] = useState('')

  const updateRichtext = async (item, editorState, token) => {
    const aemHost = editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
    
    const payload = {
      connections: [{
        name: "aemconnection",
        protocol: "xwalk",
        uri: aemHost
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

  const extractLinks = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const links = doc.querySelectorAll('a');
    return Array.from(links).map(link => ({
      href: link.getAttribute('href'),
      title: link.getAttribute('title') || '',
      text: link.textContent
    }));
  }

  const handleTextChange = (itemId, newValue) => {
    setTextValues(prev => ({
      ...prev,
      [itemId]: newValue
    }));
  }

  const handleSave = async (item) => {
    const token = guestConnection.sharedContext.get("token");
    const updatedContent = textValues[item.id] || item.content;
    
    const updatedItem = {
      ...item,
      content: updatedContent
    };
    

    await updateRichtext(updatedItem, editorState, token);

    item.content = updatedContent;

    window.location.reload();
  }

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const state = await connection.host.editorState.get();
      setEditorState(state);

      if(!state){
        return;
      }

      const url = state.location.split('?')[0];
      setPageUrl(url);
        
      if(state.editables && Array.isArray(state.editables)) {
        const items = state.editables.filter(item => item.type === RICHTEXT_TYPE);
        setRichtextItems(items);
        
        const initialValues = {};
        items.forEach(item => {
          initialValues[item.id] = item.content;
        });
        setTextValues(initialValues);
      }
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='light' height='100vh'>
      <Content height='100%'>
        <View padding='size-200'>
          <Heading marginBottom='size-100' level='3'>Links in Block</Heading>
          <Divider size='S' marginBottom='size-100'/>
          <View>
            {richtextItems?.map((item, i) => {
              const links = extractLinks(item.content);
              return (
                <Flex direction='column' gap='size-65' marginBottom='size-200' key={item.id}>
                  <Flex direction='column'>
                    <View
                      borderWidth='thin'
                      borderColor='gray-400'
                      borderRadius='medium'
                      padding='size-100'
                      backgroundColor='gray-50'
                    >
                      <Text><em>Links found:</em></Text>
                      {links.length > 0 ? (
                        links.map((link, idx) => (
                          <View key={idx} marginTop='size-50'>
                            <Text>
                              {link.text}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text>No links found</Text>
                      )}
                    </View>
                    <View marginTop='size-100'>
                      <TextArea
                        width='100%'
                        label="Edit Content"
                        value={textValues[item.id] || ''}
                        onChange={(value) => handleTextChange(item.id, value)}
                      />
                    </View>
                    <Flex direction='row' marginTop='size-100'>
                      <Button 
                        variant="primary" 
                        onPress={() => handleSave(item)}
                        isDisabled={textValues[item.id] === item.content}
                      >
                        Save & Refresh
                      </Button>
                    </Flex>
                  </Flex>
                  <Divider size='S' marginTop='size-100'/>
                </Flex>
              )
            })}
          </View>
        </View>
      </Content>
    </Provider>
  )
}
