import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Flex,
  ComboBox, Item
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()
  let [value, setValue] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const FOLDERS_QUERY = "/bin/querybuilder.json?" +
                            "path=/content/dam" +
                            "&type=sling:Folder" +
                            "&property=hidden" +
                            "&property.operation=not" +
                            "&path.flat=true" +
                            "&p.limit=10"

  const fetchRootFolders = async (AEM_HOST, connection) => {
    const foldersQueryUrl = `${AEM_HOST}${FOLDERS_QUERY}`;       
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${connection.sharedContext.get("token")}`
      }
    };
    const response = await fetch(foldersQueryUrl, requestOptions)
    const folderList = (await response.json()).hits?.map(hit => ({
            path: hit.path,
            title: hit.title
        })) || [];

    return (folderList);
  };

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
  }

  useEffect(() => {
    (async () => {
      const connection = await attach({ id: extensionId })
      setGuestConnection(connection);

      const model = await connection.host.field.getModel();
      console.log("Dropdown model.name----------->", model.name);
      
      setValue(await connection.host.field.getValue() || '');

      const editorState = await connection.host.editorState.get();

      if(editorState){
        const folderList = await fetchRootFolders(getAemHost(editorState), connection);

        setFolders(folderList);
        setLoading(false);

        document.body.style.height = '200px';
      }
    })()
  }, [])

  const handleSelectionChange = (newValue) => {
    setValue(newValue);
    guestConnection?.host.field.onChange(newValue);
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        <ComboBox 
          selectedKey={value} 
          onSelectionChange={handleSelectionChange} 
          label="Select Root Folder"
          isDisabled={loading}
          width="100%"
        >
          {folders.map(folder => (
            <Item key={folder.path}>{folder.title}</Item>
          ))}
        </ComboBox>
      </View>
    </Provider>
  )
}

