import React, { useState, useEffect, useRef } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Provider,
  defaultTheme,
  View,
  Content,
  ComboBox, Item
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemDynamicSelectField () {
  const [guestConnection, setGuestConnection] = useState()
  const [aemHost, setAemHost] = useState('')
  let [value, setValue] = useState(null);
  const [model, setModel] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const FOLDERS_QUERY = "/bin/querybuilder.json?" +
                            "path=/content/dam" +
                            "&type=sling:Folder" +
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
            name: hit.name || hit.path.split('/').pop()
        })) || [];

    console.log("folderList----0000----", folderList);

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
      setModel(model);
      setValue(await connection.host.field.getValue() || '');

      const editorState = await connection.host.editorState.get();

      if(editorState){
        const hostValue = getAemHost(editorState);
        setAemHost(hostValue);

        const folderList = await fetchRootFolders(hostValue, connection);
        setFolders(folderList);
        setLoading(false);
      }
    })()
  }, [])

  const handleSelectionChange = (newValue) => {
    setValue(newValue);
    guestConnection?.host.field.onChange(newValue);
  }

  return (
    <Provider theme={defaultTheme} colorScheme='dark' height='100vh'>
        <Content height='100%'>
      <View padding='size-200' UNSAFE_style={{ overflow: 'hidden' }}>
        <ComboBox 
          selectedKey={value} 
          onSelectionChange={handleSelectionChange} 
          label="Root Folder"
          isDisabled={loading}
          width="100%"
        >
          {folders.map(folder => (
            <Item key={folder.path}>{folder.name}</Item>
          ))}
        </ComboBox>
      </View>
      </Content>
    </Provider>
  )
}

