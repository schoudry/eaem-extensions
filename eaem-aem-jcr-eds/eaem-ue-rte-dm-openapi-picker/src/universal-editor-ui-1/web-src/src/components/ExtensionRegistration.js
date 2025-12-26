/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId, BROADCAST_CHANNEL_NAME, EVENT_AUE_CONTENT_DETAILS, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants";
import metadata from '../../../../app-metadata.json';

function ExtensionRegistration() {
  const init = async () => {
    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    const guestConnection = await register({
      id: extensionId,
      metadata,
      methods: {
        canvas: {
          getRenderers() {
            return [
              {
                extension: 'eaem-rte-image-picker',
                dataType: 'eaem:rte-dm-open-api-images',
                url: '/index.html#/eaem-rte-image-picker',
                icon: 'OpenIn'
              }
            ];
          },
        },
        events: {
          listen: (eventName, eventData) => {
            if (eventName === EVENT_AUE_UI_UPDATE ) {
              channel.postMessage({
                type: eventName,
                data: eventData.data
              });
            }
          }
        },
      },
    });
  };
  init().catch(console.error);

  return <Text>IFrame for integration with Host (AEM)...</Text>
}

export default ExtensionRegistration;
