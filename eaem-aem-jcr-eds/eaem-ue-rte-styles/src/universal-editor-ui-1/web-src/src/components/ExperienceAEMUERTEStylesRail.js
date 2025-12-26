import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import {
  Provider,
  Content,
  defaultTheme,
  Heading,
  View,
  ComboBox,
  Item,Text
} from "@adobe/react-spectrum";

import {
  extensionId,
  BROADCAST_CHANNEL_NAME,
  EVENT_AUE_UI_SELECT,
} from "./Constants";

export default function ExperienceAEMUERTEStylesRail() {
  const [guestConnection, setGuestConnection] = useState();
  const [editorState, setEditorState] = useState(null);
  const [richtextItem, setRichtextItem] = useState({});
  const [textValue, setTextValue] = useState("");
  const [rteStyles, setRteStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [markedText, setMarkedText] = useState("");

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(
      editorState.connections.aemconnection.indexOf("xwalk:") + 6
    );
  };

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

  const handleSelectionChange = async (styleName) => {
    if(!markedText)  return;
    
    setSelectedStyle(styleName);
    
    let updatedTextValue = textValue;

    if (markedText && textValue) {
      // Replace //markedText// with //[styleName] markedText//
      const escapedMarkedText = markedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const oldPattern = new RegExp(`(?<!:)\/\/${escapedMarkedText}\/\/`, 'g');
      const newPattern = `//[${styleName}] ${markedText}//`;
      
      updatedTextValue = textValue.replace(oldPattern, newPattern);
      setTextValue(updatedTextValue);
    }

    const updatedItem = {
      ...richtextItem,
      content: updatedTextValue
    };

    await updateRichtext(updatedItem, editorState, await guestConnection.sharedContext.get("token"));

    await guestConnection.host.editorActions.refreshPage();
  };

  const convertSpanToMarkedText = (content) => {
    if (!content) return content;

    // Pattern: <span class="classname">text</span> to //[classname]text//
    const pattern = /<span class="([^"]+)">([^<]+)<\/span>/g;
    
    const converted = content.replace(pattern, '//[$1]$2//');
    
    console.log("Converted content:", converted);
    
    return converted;
  };

  const extractMarkedText = (content) => {
    if (!content) return "";

    // Match //text// but NOT //[classname] text// ( ignore already styled text)
    const pattern = /(?<!:)\/\/(?!\[)([^\/]+?)\/\//;
    const match = content.match(pattern);

    return match ? match[1].trim() : "";
  };

  const loadRTEStyles = async () => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/schoudry/eaem-dev-eds/main/styles/rte-styles.css"
      );
      const cssText = await response.text();

      // Extract class names from CSS using regex, Pattern: .classname { ... }
      const classNameRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
      const matches = [];
      let match;

      while ((match = classNameRegex.exec(cssText)) !== null) {
        matches.push(match[1]);
      }

      setRteStyles(matches);
      return matches;
    } catch (error) {
      console.error("Error loading RTE styles:", error);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      await loadRTEStyles();

      const connection = await attach({ id: extensionId });
      setGuestConnection(connection);

      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

      channel.onmessage = async (event) => {
        if (!event.data.type) {
          return;
        }

        const state = await connection.host.editorState.get();
        setEditorState(state);

        if (event.data.type) {
          const resource = event.data.type === EVENT_AUE_UI_SELECT ? event.data.data.resource : event.data.data.request.target.resource;
          const item = state.editables.filter( (editableItem) => editableItem.resource === resource)[0];

          if (item) {
            if (!item.content && item.children && item.children.length > 0) {
              //for custom blocks "richtext" is child of the custom block
              let child = state.editables.filter(
                (editableItem) => editableItem.id === item.children[0]
              )[0];
              child.resource = item.resource;
              item = child;
            }

            const convertedContent = convertSpanToMarkedText(item.content || "");
            
            setRichtextItem(item);
            setTextValue(convertedContent);
            setMarkedText(extractMarkedText(convertedContent));
          }
        }

        return () => {
          channel.close();
        };
      };
    })();
  }, []);

  return (
    <Provider theme={defaultTheme} colorScheme="dark" height="100vh">
      <Content height="100%">
        <View padding="size-200">
          <Heading marginBottom="size-100" level="3">
            Marked Text
          </Heading>
          <Text UNSAFE_style={{ fontStyle: markedText ? 'normal' : 'italic' }}>
            {markedText || "No marked text found, add using pattern // eg. //This is marked text//"}
          </Text>
          <Heading marginTop="size-300" marginBottom="size-100" level="3">
            Available Styles
          </Heading>
          <ComboBox
            selectedKey={selectedStyle}
            onSelectionChange={handleSelectionChange}
            width="100%"
            marginTop="size-200"
          >
            {rteStyles.map((styleName) => (
              <Item key={styleName}>{styleName}</Item>
            ))}
          </ComboBox>
        </View>
      </Content>
    </Provider>
  );
}
