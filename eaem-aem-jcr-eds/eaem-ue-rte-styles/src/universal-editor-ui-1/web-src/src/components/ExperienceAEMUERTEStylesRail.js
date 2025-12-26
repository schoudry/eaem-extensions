import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import {
  Provider,
  Content,
  defaultTheme,
  Heading,
  View,
  ComboBox,
  Item,
} from "@adobe/react-spectrum";

import { extensionId } from "./Constants";

export default function ExperienceAEMUERTEStylesRail() {
  const [guestConnection, setGuestConnection] = useState();
  const [editorState, setEditorState] = useState(null);
  const [richtextItem, setRichtextItem] = useState({});
  const [textValue, setTextValue] = useState("");
  const [rteStyles, setRteStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(
      editorState.connections.aemconnection.indexOf("xwalk:") + 6
    );
  };

  const handleSelectionChange = (styleName) => {
    setSelectedStyle(styleName);
    console.log("Selected style:", styleName);
  };

  const loadRTEStyles = async () => {
    try {
      const response = await fetch('https://raw.githubusercontent.com/schoudry/eaem-dev-eds/main/styles/rte-styles.css');
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
      console.error('Error loading RTE styles:', error);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      await loadRTEStyles();

      const connection = await attach({ id: extensionId });
      setGuestConnection(connection);
    })();
  }, []);

  return (
    <Provider theme={defaultTheme} colorScheme="dark" height="100vh">
      <Content height="100%">
        <View padding="size-200">
          <Heading marginBottom="size-100" level="3">
            Available Styles
          </Heading>
          <ComboBox selectedKey={selectedStyle} onSelectionChange={handleSelectionChange} width="100%" marginTop="size-200">
          {rteStyles.map(styleName => (
            <Item key={styleName}>{styleName}</Item>
          ))}
        </ComboBox>
        </View>
      </Content>
    </Provider>
  );
}
