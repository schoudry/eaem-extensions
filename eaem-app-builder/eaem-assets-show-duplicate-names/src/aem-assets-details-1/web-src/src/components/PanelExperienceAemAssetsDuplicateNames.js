/*
 * <license header>
 */

import React, { useState, useEffect } from 'react';
import { attach } from '@adobe/uix-guest';
import {
  Flex,
  Provider,
  defaultTheme,
  Link,
  Text,
  ButtonGroup,
  Button,
  View
} from '@adobe/react-spectrum';

import { extensionId } from './Constants';

export default function PanelExperienceAemAssetsDuplicateNames() {
  // Fields
  const [guestConnection, setGuestConnection] = useState();
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    (async () => {
      const guestConnection = await attach({ id: extensionId });
      setGuestConnection(guestConnection);

      const { colorScheme } = await guestConnection.host.theme.getThemeInfo();
      setColorScheme(colorScheme);
    })()
  }, []);

  function displayToast(variant, message) {
    guestConnection.host.toast.display({ variant, message });
  }

  return (
  <Provider theme={defaultTheme} colorScheme={colorScheme} height={'100vh'}>
    <View backgroundColor="gray-50">
      <View padding="size-300">
        <Text>Please visit <Link href="https://developer.adobe.com/uix/docs/">UI Extensibility documentation</Link> to get started.</Text>

        <Flex justifyContent="center" marginTop="size-400">
          <ButtonGroup>
            <Button variant="primary" onPress={() => displayToast('neutral', 'Message from the Extension')}>Click me!</Button>
          </ButtonGroup>
        </Flex>
      </View>
    </View>
  </Provider>
  );
}
