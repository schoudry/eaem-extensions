import React, { useState, useEffect, useMemo } from "react";
import { attach } from "@adobe/uix-guest";
import { Provider, Content, defaultTheme, Heading, View, ComboBox, Item, Text, Button, Flex, Link } from "@adobe/react-spectrum";

import { extensionId, UNIVERSAL_EDITOR_CONFIG_SPREADSHEET, RTE_STYLES_URL,
  RTE_STYLE_CLASS_PREFIX, MARKED_TEXT_PREFIX, MARKED_TEXT_SUFFIX,
  BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE, SELECTION_MESSAGE_TYPE } from "./Constants";

/** Dropdown label: optional strip of rte- prefix, then kebab → Title Case words */
function classNameToDropdownLabel(className, prefix) {
  const raw = typeof className === 'string' ? className.trim() : ''
  if (!raw) return ''
  const body = prefix && raw.startsWith(prefix) ? raw.slice(prefix.length) : raw
  return body
    .split('-')
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
    .join(' ')
}

/** Parsed //[STYLE_CLASS]text// segments from converted richtext content */
function extractStyledMarkedSegments(content) {
  if (!content || typeof content !== "string") {
    return [];
  }

  const re = /\/\/\[([^\]]+)\]\s*([\s\S]*?)\/\//g;
  const out = [];
  let m;

  while ((m = re.exec(content)) !== null) {
    out.push({
      styleClass: m[1].trim(),
      text: m[2].trim(),
    });
  }
  return out;
}

/** Remove the n-th //[class]text// marker, leaving plain inner text in place */
function removeStyledMarkedSegmentAt(content, segmentIndex) {
  if (!content || typeof content !== "string") {
    return content;
  }
  const re = /\/\/\[([^\]]+)\]\s*([\s\S]*?)\/\//g;
  const matches = [...content.matchAll(re)];
  if (segmentIndex < 0 || segmentIndex >= matches.length) {
    return content;
  }
  const m = matches[segmentIndex];
  const inner = m[2];
  const start = m.index;
  const full = m[0];
  return content.slice(0, start) + inner + content.slice(start + full.length);
}

export default function ExperienceAEMUERTEStylesRail() {
  const [guestConnection, setGuestConnection] = useState();
  const [editorState, setEditorState] = useState(null);
  const [richtextItem, setRichtextItem] = useState({});
  const [textValue, setTextValue] = useState("");
  const [rteStyles, setRteStyles] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState("");
  const [pageSelectedText, setPageSelectedText] = useState("");
  const [rteStylesUrlMissing, setRteStylesUrlMissing] = useState(false);

  const styledMarkedSegments = useMemo(
    () => extractStyledMarkedSegments(textValue),
    [textValue],
  );

  const getAemHost = (editorState) => {
    let host = editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
    
    if (host.includes('?ref=')) {
      host = host.split('?ref=')[0];
    }
    
    return host;
  }

  const getBranch = (editorState) => {
    const url = new URL(editorState.location);
    return url.searchParams.get('ref') || ""
  }

  const getSiteRoot = (editorState) => {
    const url = new URL(editorState.location);

    const tokenizedPath = url.pathname.match(/^(\/content\/[^/]+\/[^/]+)/);
    if (tokenizedPath) {
      return tokenizedPath[1];
    }
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
    if(!pageSelectedText)  return;
    
    setSelectedStyle(styleName);

    console.log('textValue------', textValue);
    
    let markedSelectedText = `//[${styleName}] ${pageSelectedText}//`;
    let updatedTextValue = textValue.replace(pageSelectedText, markedSelectedText);

    setTextValue(updatedTextValue);

    const updatedItem = {
      ...richtextItem,
      content: updatedTextValue
    };

    await updateRichtextWithGuest(updatedItem);

    await guestConnection.host.editorActions.refreshPage();
  };

  const handleShowStyled = async () => {
    const url = new URL(editorState.location);
    url.searchParams.set('edsRTEShowStyled', 'true');
    await guestConnection.host.editorActions.navigateTo(url.toString())
  };

  const handleShowMarked = async () => {
    const url = new URL(editorState.location);
    url.searchParams.set('edsRTEShowStyled', 'false');
    await guestConnection.host.editorActions.navigateTo(url.toString())
  };

  const handleRemoveStyledSegment = async (segmentIndex) => {
    if (!guestConnection || !richtextItem?.id) {
      return;
    }

    const updatedContent = removeStyledMarkedSegmentAt(textValue, segmentIndex);
    setTextValue(updatedContent);

    const updatedItem = {
      ...richtextItem,
      content: updatedContent,
    };
    
    await updateRichtextWithGuest(updatedItem);
    await guestConnection.host.editorActions.refreshPage();
  };

  const convertSpanToMarkedText = (content) => {
    if (!content) return content;

    // Pattern: <span class="classname">text</span> to //[classname]text//
    const pattern = /<span class="([^"]+)">([^<]+)<\/span>/g;
    
    const converted = content.replace(pattern, '//[$1]$2//');
    
    return converted;
  };

  const loadUniversalEditorConfig = async (siteRoot, aemHost, aemToken) => {
    try {
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${aemToken}`
        }
      };

      const queryBuilderUrl =
        `${aemHost}/bin/querybuilder.json?path=${siteRoot}/${UNIVERSAL_EDITOR_CONFIG_SPREADSHEET}` +
        `&property=Key&property.value=${RTE_STYLES_URL}` +
        `&p.hits=selective&p.properties=Key Value`;

      const response = await fetch(queryBuilderUrl, requestOptions);

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

  useEffect(() => {
    const onMessage = (event) => {
      if (!event.data || event.data.type !== SELECTION_MESSAGE_TYPE) {
        return;
      }
      if (typeof event.data.text !== "string") {
        return;
      }

      console.log('event.data.text------', event.data.text);

      setPageSelectedText(event.data.text);
    };

    window.addEventListener("message", onMessage);
    
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const loadRTEStyles = async (stylesUrl, aemToken) => {
    try {
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${aemToken}`
        }
      };
      
      console.log('Styles url------', stylesUrl);
      console.log('aemTokenl------', aemToken);

      const response = await fetch(stylesUrl, requestOptions);

      const cssText = await response.text();

      // Extract class names from CSS using regex, Pattern: .classname { ... }
      const classNameRegex = /\.([a-zA-Z0-9_-]+)\s*\{/g;
      const rawNames = [];
      let match;

      while ((match = classNameRegex.exec(cssText)) !== null) {
        rawNames.push(match[1]);
      }

      const rteStylesFiltered = [...new Set(
        rawNames.filter((name) => name.startsWith(RTE_STYLE_CLASS_PREFIX))
      )];

      setRteStyles(rteStylesFiltered);
      return rteStylesFiltered;
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

      const stylesPath = typeof ueConfig[RTE_STYLES_URL] === "string"
          ? ueConfig[RTE_STYLES_URL].trim()
          : ueConfig[RTE_STYLES_URL];

      if (!stylesPath) {
        setRteStylesUrlMissing(true);
        setRteStyles([]);
      } else {
        setRteStylesUrlMissing(false);
        const stylesUrl = getAemHost(state) + getSiteRoot(state) + "." + getBranch(state) + ".resource" + stylesPath;
        await loadRTEStyles(stylesUrl,await connection.sharedContext.get("token"));
      }

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

            console.log('item.content------', item.content);

            const convertedContent = convertSpanToMarkedText(item.content || "");

            console.log('convertedContent------', convertedContent);

            setRichtextItem(item);
            setTextValue(convertedContent);
          }
        }

        return () => {
          channel.close();
        };
      };
    })();
  }, []);

  return (
    <Provider theme={defaultTheme} >
      <Content height="100%">
        <View padding="size-200" UNSAFE_style={{ backgroundColor: 'white' }}>
          {rteStylesUrlMissing ? (
            <Text>
              No {RTE_STYLES_URL} configured in &apos;{UNIVERSAL_EDITOR_CONFIG_SPREADSHEET}&apos; spreadsheet
            </Text>
          ) : (
            <>
              <Heading marginBottom="size-100" level="3">Editable</Heading>
              <Text marginBottom="size-200">
                {richtextItem?.label ? (
                  richtextItem.label
                ) : (
                  <span style={{color: "var(--spectrum-semantic-negative-color-default, #e34850)"}}>None</span>
                )}
              </Text>
              <Heading marginBottom="size-100" level="3">Selected Text</Heading>
              <Text UNSAFE_style={{ fontStyle: pageSelectedText ? 'normal' : 'italic' }}>
                {pageSelectedText || "No text selected"}
              </Text>
              <Heading marginTop="size-300" marginBottom="size-100" level="3">Available Styles</Heading>
              <ComboBox selectedKey={selectedStyle} onSelectionChange={handleSelectionChange} width="100%" placeholder="Select Style" marginTop="size-200">
                {rteStyles.map((styleName) => {
                  const titleLabel = classNameToDropdownLabel(styleName, RTE_STYLE_CLASS_PREFIX)
                  return (
                    <Item key={styleName} textValue={titleLabel}>{titleLabel}</Item>
                  )
                })}
              </ComboBox>
              <Flex direction="row" gap="size-100" marginTop="size-300">
                <Button variant="secondary" onPress={handleShowMarked} flex={1}>Show Marked</Button>
                <Button variant="secondary" onPress={handleShowStyled} flex={1}>Show Styled</Button>
              </Flex>
              {styledMarkedSegments.length > 0 ? (
                <View marginTop="size-500">
                  <Heading marginBottom="size-100" level="4">
                    Styled Texts
                  </Heading>
                  {styledMarkedSegments.map((seg, i) => (
                    <Flex
                      key={`${seg.styleClass}-${i}`}
                      direction="column"
                      gap="size-50"
                      marginBottom="size-200"
                      width="100%"
                    >
                      <Text elementType="div">Class: {seg.styleClass}</Text>
                      <Text elementType="div">Text: {seg.text}</Text>
                      <Link onPress={() => handleRemoveStyledSegment(i)}>
                        Remove Class
                      </Link>
                    </Flex>
                  ))}
                </View>
              ) : null}
            </>
          )}
        </View>
      </Content>
    </Provider>
  );
}
