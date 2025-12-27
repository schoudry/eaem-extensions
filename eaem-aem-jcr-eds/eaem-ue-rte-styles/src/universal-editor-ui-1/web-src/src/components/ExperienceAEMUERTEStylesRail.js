import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import { Provider, Content, defaultTheme, Heading, View, ComboBox, Item, Text, Button, Flex } from "@adobe/react-spectrum";

import { extensionId, UNIVERSAL_EDITOR_CONFIG_SPREADSHEET, RTE_STYLES_URL, 
  BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE} from "./Constants";

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

  const getSiteRoot = (editorState) => {
    const url = new URL(editorState.location);

    // Extract root something like /content/site-name
    const match = url.pathname.match(/^(\/content\/[^\/]+)/);
    
    return match ? match[1] : '';
  };

  const updateRichtextWithGuest = async (editable) => {
    const target = {
      editable: { id: editable.id }
    };

    const patch = [{
      op: "replace",
      path: "/" + editable.prop,
      value: editable.content
    }]

    await guestConnection.host.editorActions.update( { target, patch });
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

    await updateRichtextWithGuest(updatedItem);

    await guestConnection.host.editorActions.refreshPage();
  };

  const handleShowStyled = async () => {
    const url = new URL(editorState.location);
    url.searchParams.set('eaemRTEShowStyled', 'true');
    await guestConnection.host.editorActions.navigateTo(url.toString())
  };

  const handleShowMarked = async () => {
    const url = new URL(editorState.location);
    url.searchParams.set('eaemRTEShowStyled', 'false');
    await guestConnection.host.editorActions.navigateTo(url.toString())
  };

  const convertSpanToMarkedText = (content) => {
    if (!content) return content;

    // Pattern: <span class="classname">text</span> to //[classname]text//
    const pattern = /<span class="([^"]+)">([^<]+)<\/span>/g;
    
    const converted = content.replace(pattern, '//[$1]$2//');
    
    return converted;
  };

  const extractMarkedText = (content) => {
    if (!content) return "";

    // Match //text// but NOT //[classname] text// ( ignore already styled text)
    const pattern = /(?<!:)\/\/(?!\[)([^\/]+?)\/\//;
    const match = content.match(pattern);

    return match ? match[1].trim() : "";
  };

  const loadUniversalEditorConfig = async (siteRoot, aemHost, aemToken) => {
    try {
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${aemToken}`
        }
      };

      const response = await fetch(
        `${aemHost}/bin/querybuilder.json?path=${siteRoot}/${UNIVERSAL_EDITOR_CONFIG_SPREADSHEET}` +
        `&property=Key&property.value=${RTE_STYLES_URL}` +
        `&p.hits=selective&p.properties=Key Value`, requestOptions
      );

      const data = await response.json();
      const config = {};

      data.hits.forEach(hit => {
        if (hit.Key && hit.Value) {
          config[hit.Key] = hit.Value;
        }
      });
      
      return config;
    } catch (error) {
      console.error("Error loading Universal Editor config:", error);
      return {};
    }
  };

  const loadRTEStyles = async (stylesUrl) => {
    try {
      const response = await fetch(stylesUrl);
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
      const connection = await attach({ id: extensionId });
      setGuestConnection(connection);

      let state = await connection.host.editorState.get();
      setEditorState(state);

      const ueConfig = await loadUniversalEditorConfig(getSiteRoot(state), getAemHost(state), 
                        await connection.sharedContext.get("token"));

      await loadRTEStyles(ueConfig[RTE_STYLES_URL]);

      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);

      channel.onmessage = async (event) => {
        if (!event.data.type) {
          return;
        }

        if (event.data.type === EVENT_AUE_UI_SELECT || event.data.type === EVENT_AUE_UI_UPDATE) {
          state = await connection.host.editorState.get();
          setEditorState(state);

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
          <Heading marginBottom="size-100" level="3">Marked Text</Heading>
          <Text UNSAFE_style={{ fontStyle: markedText ? 'normal' : 'italic' }}>
            {markedText || "No marked text found, add using pattern // eg. //This is marked text//"}
          </Text>
          <Heading marginTop="size-300" marginBottom="size-100" level="3">Available Styles</Heading>
          <ComboBox selectedKey={selectedStyle} onSelectionChange={handleSelectionChange} width="100%" placeholder="Select Style" marginTop="size-200">
            {rteStyles.map((styleName) => (
              <Item key={styleName}>{styleName}</Item>
            ))}
          </ComboBox>
          <Flex direction="row" gap="size-100" marginTop="size-500">
            <Button variant="secondary" onPress={handleShowMarked} flex={1}>Show Marked</Button>
            <Button variant="secondary" onPress={handleShowStyled} flex={1}>Show Styled</Button>
          </Flex>
        </View>
      </Content>
    </Provider>
  );
}
