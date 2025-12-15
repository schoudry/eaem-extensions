/*
 * <license header>
 */

import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from '../../../../app-metadata.json';

import { extensionId, BROADCAST_CHANNEL_NAME, EVENT_AUE_UI_SELECT, EVENT_AUE_UI_UPDATE } from "./Constants";

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      metadata,
      methods: {
        events: {
          listen: (eventName, eventData) => {
            if (eventName === EVENT_AUE_UI_SELECT || eventName === EVENT_AUE_UI_UPDATE) {
              channel.postMessage({
                type: eventName,
                data: eventData.data
              });
            }
          }
        },
        rightPanel: {
          addRails() {
            return [
              // YOUR ACTION BAR BUTTONS CODE SHOULD BE HERE
              {
                'id': 'experience-aem-ue-rte-links-open-new-tab',
                'header': 'Experience AEM UE RTE Links Open New Tab',
                'icon': 'PublishCheck',
                'url': '/#/experience-aem-ue-rte-links-open-new-tab-rail'
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
