/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from '../../../../app-metadata.json';

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      metadata,
      methods: {
        rightPanel: {
          addRails() {
            return [
              // YOUR ACTION BAR BUTTONS CODE SHOULD BE HERE
              {
                'id': 'eaem-rde-hello',
                'header': 'eaem rde hello',
                'icon': 'PublishCheck',
                'url': '/#/eaem-rde-hello-rail'
              },
            ];
          },
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>
}

export default ExtensionRegistration;
