/*
 * <license header>
 */

import { Text, View, Provider, defaultTheme, Heading } from "@adobe/react-spectrum";
import { register } from "@adobe/uix-guest";
import { extensionId } from "./Constants";
import metadata from '../../../../app-metadata.json';

function ExtensionRegistration() {
  const init = async () => {
    const guestConnection = await register({
      id: extensionId,
      metadata,
      methods: {
        headerMenu: {
          getButtons() {
            return [
              // YOUR HEADER BUTTONS CODE SHOULD BE HERE
              {
                'id': 'add-page',
                'label': 'Add Page',
                'icon': 'OpenIn',
                onClick() {
                  const modalURL = "/index.html#/add-page-modal";
                  console.log("Modal URL: ", modalURL);

                  guestConnection.host.modal.showUrl({
                    title: "Add Page",
                    url: modalURL,
                    width: '80vw',
                    height: '70vh'
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

  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <View padding="size-200" maxWidth="size-6000">
        <Heading level={3}>AEM Page Creation (v2)</Heading>
        <View marginTop="size-100">
          <Text>
            This frame registers the extension with Universal Editor. Use the
            <strong> Add Page </strong>
            control in the editor header to open the modal and create content.
          </Text>
        </View>
      </View>
    </Provider>
  );
}

export default ExtensionRegistration;
