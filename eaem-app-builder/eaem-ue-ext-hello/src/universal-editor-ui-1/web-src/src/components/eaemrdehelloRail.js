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
  Checkbox,
  Heading
} from '@adobe/react-spectrum'

import { extensionId, RICHTEXT_TYPE, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants"

export default function EaemrdehelloRail () {
  const [guestConnection, setGuestConnection] = useState()
  const [editorState, setEditorState] = useState(null)
  const [richtextItem, setRichtextItem] = useState({})
  const [textValue, setTextValue] = useState('')
  const [itemLinks, setItemLinks] = useState([])

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

    console.log("------> item.content ", item.content);

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
    return Array.from(links).map(link => {
      const href = link.getAttribute('href') || '';
      const hasOpenInNewTab = href.includes('open_in_new_tab=true');
      return {
        text: link.textContent,
        outerHTML: link.outerHTML,
        isOpenInNewTab: hasOpenInNewTab
      };
    });
  }

  const handleLinkTargetChange = (itemId, linkOuterHTML, isChecked) => {
    const currentContent = textValue;
    
    const hrefMatch = linkOuterHTML.match(/href="([^"]*)"/);
    if (!hrefMatch) return;
    
    const oldHref = hrefMatch[1];
    let newHref = oldHref;
    
    if (isChecked) {
      if (newHref.includes('?')) {
        newHref = newHref.includes('open_in_new_tab=') 
          ? newHref.replace(/open_in_new_tab=(true|false)/, 'open_in_new_tab=true')
          : newHref + '&open_in_new_tab=true';
      } else {
        newHref = newHref + '?open_in_new_tab=true';
      }
    } else {
      newHref = newHref
        .replace(/[?&]open_in_new_tab=true/, '')
        .replace(/\?&/, '?');
    }
    
    const updatedLink = linkOuterHTML.replace(`href="${oldHref}"`, `href="${newHref}"`);
    const updatedContent = currentContent.replace(linkOuterHTML, updatedLink);
    
    setTextValue(updatedContent);

    setItemLinks(prev => prev.map(link => 
      link.outerHTML === linkOuterHTML 
        ? { ...link, isOpenInNewTab: isChecked, outerHTML: updatedLink }
        : link
    ));
  }

  const handleSave = async (item) => {
    const token = guestConnection.sharedContext.get("token");
    const updatedContent = textValue || item.content;
    
    const updatedItem = {
      ...item,
      content: updatedContent
    };

    await updateRichtext(updatedItem, editorState, token);

    await guestConnection.host.editorActions.refreshPage();
  }

  useEffect(() => {
    (async () => {
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
              //for custom componentts "richtext" is child of the custom component
              let child = state.editables.filter(editableItem => editableItem.id === item.children[0])[0];
              child.resource = item.resource;

              item = child;
            }

            setRichtextItem(item);

            setTextValue( item.content || '');
            
            setItemLinks(extractLinks(item.content || ''));
          }
        }
  
        return () => {
          channel.close();
        };
      };
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
