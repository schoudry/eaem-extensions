/*
 * <license header>
 */

import React from 'react';
import { Text } from '@adobe/react-spectrum';
import { register } from '@adobe/uix-guest';
import { extensionId } from './Constants';

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        detailSidePanel: {
          getPanels() {
            return [
              {
                'id': 'experience-aem-assets-duplicate-names',
                'tooltip': 'Experience AEM Assets Show Duplicates',
                'icon': 'Hand2',
                'title': 'Experience AEM Assets Duplicates',
                'contentUrl': '/#experience-aem-assets-duplicate-names',
                'reloadOnThemeChange': 'true',
              },
            ];
          },
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM Assets View)...</Text>;
}

export default ExtensionRegistration;
