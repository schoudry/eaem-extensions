import React, { useState, useEffect } from 'react';
import { attach } from '@adobe/uix-guest';
import {
  Flex,
  Provider,
  defaultTheme,
  Text,
  Button,
  View
} from '@adobe/react-spectrum';

import { extensionId } from './Constants';

export default function PanelExperienceAemAssetsDuplicateNames() {
  const [guestConnection, setGuestConnection] = useState();
  const [colorScheme, setColorScheme] = useState('light');
  const [aemToken, setAemToken] = useState('');
  const [aemHost, setAemHost] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [duplicates, setDuplicates] = useState([]);

  const printEssentials = (aemHost, imsInfo, assetInfo) => {
    console.log("aemHost -> ", aemHost);
    console.log("imsInfo.imsOrg -> ", imsInfo.imsOrg);
    console.log("imsInfo.accessToken -> ", imsInfo.accessToken);
    console.log("assetInfo -> ", assetInfo);
  };

  const showAsset = (path) => {
    guestConnection.host.router.navigateToAssetDetails({ assetPath: path });
  };

  const getDuplicates = async (aemHost, accessToken, path) => {
    if (!path) {
      console.error('Path is required');
      return [];
    }

    const fileName = path?.split('/').pop();

    const queryBuilderUrl = `${aemHost}/bin/querybuilder.json`;
    const queryParams = new URLSearchParams({
      'path': '/content/dam',
      'group.p.or': 'true',
      'group.0_nodename': fileName
    });

    try {
      const response = await fetch(`${queryBuilderUrl}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.hits && data.hits.length > 0) {
          // Filter out the current asset's path
          return data.hits
            .map(hit => hit.path)
            .filter(hitPath => hitPath !== path);
        }
        return [];
      } else {
        console.error('Query Builder request failed:', response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error('Error executing Query Builder query:', error);
      return [];
    }
  };

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      setGuestConnection(guestConnection);

      const { colorScheme } = await guestConnection.host.theme.getThemeInfo();
      setColorScheme(colorScheme);

      const imsInfo =  await guestConnection.host.auth.getIMSInfo();
      const aemHost = await guestConnection.host.discovery.getAemHost();
      const assetInfo = await guestConnection.host.details.getCurrentResourceInfo();

      setAemHost(aemHost);
      setAccessToken(imsInfo.accessToken);

      printEssentials(aemHost, imsInfo, assetInfo);

      const duplicatePaths = await getDuplicates(aemHost, imsInfo.accessToken, assetInfo?.path);
      setDuplicates(duplicatePaths);
    })()
  }, []);

  return (
  <Provider theme={defaultTheme} colorScheme={colorScheme} height={'100vh'}>
    <View backgroundColor="gray-50" padding="size-300">
      {duplicates.length === 0 ? (
        <Text>No duplicates found</Text>
      ) : (
        <Flex direction="column" gap="size-100">
          {duplicates.map((path, index) => (
            <Flex key={index} direction="column" gap="size-100">
              <Text><strong></strong> {path}</Text>
              <View alignSelf="center" marginTop="size-100">
                <img 
                  src={`${aemHost}${path}/_jcr_content/renditions/cq5dam.thumbnail.140.100.png`}
                  alt={path}
                  style={{ maxWidth: '150px', maxHeight: '150px', border: '1px solid #ccc', cursor: 'pointer' }}
                  onClick={() => showAsset(path)}
                  onError={(e) => {
                    e.target.src = `${aemHost}${path}/_jcr_content/renditions/cq5dam.thumbnail.319.319.png`;
                  }}
                />
              </View>
              <View marginTop="size-100" marginBottom="size-100" alignSelf="center">
                <Button variant="primary" onPress={() => showAsset(path)} width="size-2000" UNSAFE_style={{ cursor: 'pointer' }}>Show It</Button>
              </View>
            </Flex>
          ))}
        </Flex>
      )}
    </View>
  </Provider>
  );
}
