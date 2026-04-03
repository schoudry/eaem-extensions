import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  ComboBox,
  Flex,
  ActionButton,
  Text,
  Item
} from '@adobe/react-spectrum'
import Close from '@spectrum-icons/workflow/Close'

import { extensionId } from "./Constants"

const PICKLIST_CONFIG_NODE_NAME = 'block-styles';
const STYLE_NAME_KEY = 'Style Name';
const STYLE_CLASS_KEY = 'Style Class';

export default function MultiStylePicker () {
  const [guestConnection, setGuestConnection] = useState()
  const [textValue, setTextValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('Select Style');

  const findPicklistConfig = async (AEM_HOST, parentPath, connection, configFileName) => {
    let searchPath = parentPath;
    
    // Walk up the hierarchy until we find config file or reach /content
    while (searchPath && searchPath.startsWith('/content')) {
      const configUrl = `${AEM_HOST}${searchPath}/${configFileName}`;
      
      const requestOptions = {
        headers: {
          'Authorization': `Bearer ${connection.sharedContext.get("token")}`
        }
      };
      
      try {
        const response = await fetch(configUrl, requestOptions);
        
        if (response.status !== 404) {
          console.log(`Found ${configFileName} at: ${searchPath}/${configFileName}`);
          return `${searchPath}/${configFileName}`;
        }
      } catch (error) {
        console.log(`Error fetching ${searchPath}/${configFileName}:`, error);
      }
      
      if (searchPath === '/content') {
        break;
      }
      searchPath = searchPath.substring(0, searchPath.lastIndexOf('/')) || '/content';
    }
    
    console.log(`No ${configFileName} found in hierarchy`);

    return null;
  };

  const fetchPicklistOptions = async (AEM_HOST, configPath, connection) => {
    if (!configPath) return [];
    
    const configUrl = `${AEM_HOST}${configPath}`;
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${connection.sharedContext.get("token")}`
      }
    };
    
    try {
      const response = await fetch(configUrl, requestOptions);
      
      if (response.status === 404) {
        console.log('Config file not found (404)');
        return [];
      }
      
      const configData = await response.json();
      
      // Parse JCR structure: find all nodes with jcr:primaryType = "nt:unstructured"
      // and extract their "Style Name" and "Style Class" properties
      let optionsList = [];
      
      if (configData && configData['jcr:content']) {
        const jcrContent = configData['jcr:content'];
        
        for (const key in jcrContent) {
          const node = jcrContent[key];
          
          if (typeof node === 'object' && node !== null && node['jcr:primaryType'] === 'nt:unstructured') {
            const styleName = node[STYLE_NAME_KEY];
            const styleClass = node[STYLE_CLASS_KEY];
            
            if (styleName && styleClass) {
              optionsList.push({
                label: styleName,
                value: styleClass
              });
            }
          }
        }
      }
      
      return optionsList;
    } catch (error) {
      console.error('Error fetching or parsing config:', error);
      return [];
    }
  };

  const getAemHost = (editorState) => {
    let host = editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
    
    if (host.includes('?ref=')) {
      host = host.split('?ref=')[0];
    }
    
    return host;
  }

  const getParentPagePath = (url) => {
    if (!url) return '/content';
    
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      return pathname.substring(0,pathname.lastIndexOf('.html')).substring(0,pathname.lastIndexOf('/'));
    } catch (error) {
      console.error('Error parsing page URL:', error);
      return '/content';
    }
  }

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const model = await connection.host.field.getModel();

      if (model.label) {
        setLabel(model.label);
      }

      let configFileName = PICKLIST_CONFIG_NODE_NAME;
      
      if (model.sourceAEMNodeName) {
        configFileName = model.sourceAEMNodeName;
      }

      configFileName = `${configFileName}.2.json`;

      const currentValue = await connection.host.field.getValue() || '';
      setTextValue(currentValue);

      const editorState = await connection.host.editorState.get();

      if(editorState){
        const aemHost = getAemHost(editorState);

        const parentPath = getParentPagePath(editorState.location);
        
        const configPath = await findPicklistConfig(aemHost, parentPath, connection, configFileName);

        const picklistOptions = await fetchPicklistOptions(aemHost, configPath, connection);

        setOptions(picklistOptions);
        
        setLoading(false);
      }
    })()
  }, [])

  const handleSelectionChange = (selectedValue) => {
    if (!selectedValue) return;
    
    const existingTags = textValue ? textValue.split(' ').map(v => v.trim()).filter(v => v) : [];
    
    if (existingTags.includes(selectedValue)) {
      return;
    }
    
    const newValue = existingTags.length > 0 ? `${textValue.trim()} ${selectedValue}` : selectedValue;
    
    setTextValue(newValue);
    guestConnection?.host.field.onChange(newValue);
  }

  const handleTagRemove = (tagToRemove) => {
    const tags = textValue ? textValue.split(' ').map(v => v.trim()).filter(v => v) : [];
    const remainingTags = tags.filter(tag => tag !== tagToRemove);
    const newValue = remainingTags.join(' ');
    setTextValue(newValue);
    guestConnection?.host.field.onChange(newValue);
  }

  const selectedTags = textValue 
    ? [...new Set(textValue.split(' ').map(v => v.trim()).filter(v => v))] 
    : [];
  
  const getStyleName = (styleClass) => {
    const option = options.find(opt => opt.value === styleClass);
    return option ? option.label : styleClass;
  };

  return (
    <Provider theme={defaultTheme} >
      <View UNSAFE_style={{ overflow: 'hidden', backgroundColor: 'white', padding: '16px 16px 16px 0' }}>
        <ComboBox 
          onSelectionChange={handleSelectionChange}
          label={label}
          isDisabled={loading}
          width="100%"
        >
          {options.map(option => (
            <Item key={option.value}>{option.label}</Item>
          ))}
        </ComboBox>
        <View UNSAFE_style={{ marginTop: '16px' }}>
          <Text UNSAFE_style={{ display: 'block', marginBottom: '8px', fontSize: '12px' }}>
            Selected Styles
          </Text>
          <Flex wrap gap="size-100">
            {selectedTags.map(tag => (
              <View 
                key={tag}
                UNSAFE_style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: 'white',
                  border: '1px solid black',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}
              >
                <Text>{getStyleName(tag)}</Text>
                <ActionButton 
                  isQuiet 
                  onPress={() => handleTagRemove(tag)}
                  UNSAFE_style={{ 
                    minWidth: '10px', 
                    minHeight: '10px',
                    width: '10px',
                    height: '10px',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  <Close UNSAFE_style={{ width: '8px', height: '8px' }} />
                </ActionButton>
              </View>
            ))}
          </Flex>
        </View>
      </View>
    </Provider>
  )
}
