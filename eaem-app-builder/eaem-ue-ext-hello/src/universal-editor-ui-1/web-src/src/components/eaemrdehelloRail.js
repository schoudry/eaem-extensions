/*
 * <license header>
 */
 
import React, { useState, useEffect } from 'react'
import { attach } from "@adobe/uix-guest"
import {
  Flex,
  Form,
  ProgressCircle,
  Provider,
  Content,
  defaultTheme,
  Text,
  TextField,
  ButtonGroup,
  Button,
  Heading,
  View
} from '@adobe/react-spectrum'

import { extensionId } from "./Constants"

export default function EaemrdehelloRail () {
  const [guestConnection, setGuestConnection] = useState()
  const [edsSitesRoots, setEdsSitesRoots] = useState({})
  const [aemHost, setAemHost] = useState('')
  const [pagePath, setPagePath] = useState('')
  const [githubOrg, setGithubOrg] = useState('')

  const EDS_SITES_QUERY = "/bin/querybuilder.json?" +
                            "1_property=*/sling:resourceType" +
                            "&1_property.value=core/franklin/components/page/v1/page" +
                            "&2_property=*/cq:conf" +
                            "&2_property.operation=exists" +
                            "&path=/content"

  const FIND_ORG_QUERY = "/bin/querybuilder.json?1_property=owner" +
                        "&1_property.operation=exists" +
                        "&path=/conf" +
                        "&p.hits=selective" +
                        "&p.properties=owner"

  const fetchEdsSitesData = async (AEM_HOST, guestConnection) => {
    const sitesQueryUrl = `${AEM_HOST}${EDS_SITES_QUERY}`;       
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${guestConnection.sharedContext.get("token")}`
      }
    };
    const response = await fetch(sitesQueryUrl, requestOptions)
    const responseData = await response.json()

    return responseData.hits ? responseData.hits.reduce((map, hit) => {
      const value = hit.path.substring(hit.path.lastIndexOf('/') + 1);
      map[hit.path] = value;
      return map;
    }, {}) : {}
  }

  const getGithubOrg = async (AEM_HOST, guestConnection) => {
    const orgQueryUrl = `${AEM_HOST}${FIND_ORG_QUERY}`;       
    const requestOptions = {
      headers: {
        'Authorization': `Bearer ${guestConnection.sharedContext.get("token")}`
      }
    };
    const response = await fetch(orgQueryUrl, requestOptions)
    const responseData = await response.json()

    return responseData.hits ? responseData.hits[0].owner : ''
  }

  const getAemHost = (editorState) => {
    return editorState.connections.aemconnection.substring(editorState.connections.aemconnection.indexOf('xwalk:') + 6);
  }

  const getPagePath = (aemHost, location) => {
    let qIndex = location.lastIndexOf('?');
    let path = (qIndex !== -1) ? location.substring(0, qIndex) : location;
    if (path.startsWith(aemHost)) {
      path = path.substring(aemHost.length);
    }
    return path.endsWith('.html') ? path.substring(0, path.length - 5) : path;
  }

  const getPreviewOrLiveUrl = (siteRoots, pagePath, org, urlType) => {
    const branch = getRefParam();
    let site = '';
    let pageRelativePath = pagePath;
    
    for (const [path, value] of Object.entries(siteRoots)) {
      if (pagePath.startsWith(path)) {
        site = value;
        pageRelativePath = pagePath.substring(path.length);
      }
    }

    if(pageRelativePath == '/index') {
      pageRelativePath = '/';
    }

    const domain = urlType === 'PREVIEW' ? 'aem.page' : 'aem.live';
    return `https://${branch}--${site}--${org}.${domain}${pageRelativePath}`;
  }

  const getRefParam = () => {
    return new URLSearchParams(window.location.search).get('ref') || 'main';
  }

  const handleOpenPreview = () => {
    const url = getPreviewOrLiveUrl(edsSitesRoots, pagePath, githubOrg, 'PREVIEW');
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId })
      setGuestConnection(guestConnection);

      const editorState = await guestConnection.host.editorState.get();

      if(editorState){
        const hostValue = getAemHost(editorState);
        setAemHost(hostValue);

        const siteRoots = await fetchEdsSitesData(hostValue, guestConnection);
        const githubOrgValue = await getGithubOrg(hostValue, guestConnection);
        const pagePathValue = getPagePath(hostValue, editorState.location);

        console.log("getPreviewOrLiveUrl----->" , getPreviewOrLiveUrl(siteRoots, pagePathValue, githubOrgValue));
  
        setEdsSitesRoots(siteRoots)
        setGithubOrg(githubOrgValue)
        setPagePath(pagePathValue)
      }
    })()
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme='dark'>
      <div style={{ height: '905px',paddingTop: '20px' ,fontSize: '20px', textAlign: 'center' }}>
        <Button variant="primary" onPress={handleOpenPreview} UNSAFE_style={{ cursor: 'pointer' }}>
          Open page in preview
        </Button>
      </div>
    </Provider>
  )
}
