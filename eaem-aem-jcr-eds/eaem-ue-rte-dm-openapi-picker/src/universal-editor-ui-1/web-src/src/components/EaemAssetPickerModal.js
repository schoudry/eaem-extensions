import React, { useState, useEffect } from "react";
import { attach } from "@adobe/uix-guest";
import { Provider, defaultTheme, Content } from "@adobe/react-spectrum";
import { extensionId, BROADCAST_CHANNEL_NAME } from "./Constants";

export default function EaemAssetPickerModal() {
  const [guestConnection, setGuestConnection] = useState()
  const [colorScheme, setColorScheme] = useState("dark");
  const [assetSelectorProps, setAssetSelectorProps] = useState({});
  const [AssetSelector, setAssetSelector] = useState(null);

  const handleSelection = (assets) => {
    const optimalRenditionLink = getOptimalRenditionLink(getAssetRenditionLinks(assets));
    const assetDelLink = optimalRenditionLink.href.split('?')[0];

    const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
    channel.postMessage({
      type: 'EAEM_ASSET_PICKER_ASSET_SELECTED',
      assetUrl: assetDelLink
    });
    channel.close();

    onCloseHandler();
  };

  const getAssetRenditionLinks = (selectedAssets) => {
    const asset = selectedAssets?.[0];
    return asset?._links?.['http://ns.adobe.com/adobecloud/rel/rendition'];
  };

  const getOptimalRenditionLink = (renditions) => {
    return renditions.reduce((optimalRendition, currentRendition) => {
      const optimalResolution = optimalRendition.width * optimalRendition.height;
      const currentResolution = currentRendition.width * currentRendition.height;
      return currentResolution > optimalResolution ? currentRendition : optimalRendition;
    });
  };

  const onCloseHandler = () => {
    guestConnection.host.modal.close();
  };

  const init = async () => {
    // Dynamically import the asset selector module at runtime
    // Using dynamic string to prevent Parcel from resolving at build time
    const moduleName = "@assets" + "/" + "selectors";
    const assetSelectorModule = await import(/* @vite-ignore */ moduleName);
    setAssetSelector(() => assetSelectorModule.AssetSelector);

    const connection = await attach({ id: extensionId });
    setGuestConnection(connection);

    const editorState = await connection.host.editorState.get();
    const location = new URL(editorState.location);
    const imsToken = connection.sharedContext.get("token");
    const orgId = connection.sharedContext.get("orgId");

    const selectorProps = {
      repositoryId: `${location.host.replace('author', 'delivery')}`,
      apiKey: "asset_search_service",
      imsOrg: orgId,
      imsToken: imsToken,
      hideUploadButton: true,
      hideTreeNav: true,
    };

    setAssetSelectorProps(selectorProps);
  };

  useEffect(() => {
    init().catch((e) => console.log("Error loading asset picker modal--->", e));
  }, []);

  if (!AssetSelector) {
    return (
      <Provider theme={defaultTheme} colorScheme={colorScheme} height="100vh">
        <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading Asset Selector...
        </div>
      </Provider>
    );
  }

  return (
    <Provider theme={defaultTheme} colorScheme={colorScheme} height="100vh">
      <div style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
        <AssetSelector colorScheme={colorScheme} 
        onClose={onCloseHandler} 
        handleSelection={handleSelection}
        {...assetSelectorProps} />
      </div>
    </Provider>
  );
}
