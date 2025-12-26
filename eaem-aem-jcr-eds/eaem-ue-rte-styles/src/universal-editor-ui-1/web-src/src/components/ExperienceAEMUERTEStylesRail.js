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

  const handleSelectionChange = (styleName) => {
    setSelectedStyle(styleName);
    console.log("Selected style:", styleName);
  };

  const extractMarkedText = (content) => {
    if (!content) return "";

    // Pattern: // ANYTHING // (using negative lookbehind to avoid matching URLs like https://)
    const pattern = /(?<!:)\/\/([^\/]+?)\/\//;
    const match = content.match(pattern);

    console.log("----------content:", content);
    console.log("----------match:", match );

    return match ? match[1] : "";
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

            setRichtextItem(item);

            setTextValue(item.content || "");

            setMarkedText(extractMarkedText(item.content || ""));
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
          <Text>{markedText}</Text>
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
