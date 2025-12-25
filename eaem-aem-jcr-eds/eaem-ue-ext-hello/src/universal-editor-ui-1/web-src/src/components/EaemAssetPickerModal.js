import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import { Provider, defaultTheme, Content, useDialogContainer } from "@adobe/react-spectrum";
import {
  registerAssetsSelectorsAuthService as registerAssetsSelectorsAuthServiceInternal,
  AssetSelectorWithAuthFlow,
} from "@assets/selectors";

import { extensionId } from "./Constants";

export default function EaemAssetPickerModal() {
  const [token, setToken] = useState("");
  const [colorScheme, setColorScheme] = useState("dark");
  const [guestConnection, setGuestConnection] = useState();
  const [authorDomain, setAuthorDomain] = useState("");
  const [assetSelectorProps, setAssetSelectorProps] = useState({});
  const dialog = useDialogContainer();

  const handleSelection = (assets) => {
    console.log("Selected assets:", assets);
  };

  const init = async () => {
    const connection = await attach({ id: extensionId });
    setGuestConnection(connection);

    const editorState = await connection.host.editorState.get();
    const location = new URL(editorState.location);
    const host = `${location.protocol}//${location.host}`;

    const imsToken = connection.sharedContext.get("token");
    setToken(imsToken);

    setAuthorDomain(host);

    const selectorProps = {
        repositoryId: "author-p10961-e880305.adobeaemcloud.com",
        apiKey: "asset_search_service", //Dynamic Media with OpenAPI entitlement (Adobe Support Ticket) is required to use the asset_search_service api-key
        imsOrg: "2FBC7B975CFE21C40A495FBB@AdobeOrg",
        imsToken: imsToken,
        handleSelection,
        hideTreeNav: true,
    };

    setAssetSelectorProps(selectorProps);
  };

  useEffect(() => {
    init().catch((e) => console.log("Error loading asset picker modal--->", e));
  }, []);

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme}>
      <Content>
        <AssetSelectorWithAuthFlow
            {...assetSelectorProps}
        ></AssetSelectorWithAuthFlow>
      </Content>
    </Provider>
  );
}
