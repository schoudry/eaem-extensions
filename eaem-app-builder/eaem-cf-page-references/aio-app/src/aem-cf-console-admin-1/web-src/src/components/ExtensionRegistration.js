import { generatePath } from "react-router";
import { Text } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      methods: {
        actionBar: {
          getButtons() {
            return [
              {
                'id': 'page-references',
                'label': 'EAEM Page References',
                'icon': 'LinkPage',
                onClick(selections) {
                  const modalURL = "/index.html#" + generatePath("/content-fragment/:fragmentId/page-references-modal", {
                    fragmentId: encodeURIComponent(selections[0].id),
                  });

                  guestConnection.host.modal.showUrl({
                    title: "EAEM Page References",
                    url: modalURL,
                  });
                },
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
