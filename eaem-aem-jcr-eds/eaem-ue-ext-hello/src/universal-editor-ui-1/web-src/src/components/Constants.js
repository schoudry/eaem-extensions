function buildUrl(hashPath, pocVersion) {
  const fielUrl = new URL('/solutions/aem-extensibility-uex-asset-picker/resources/universal_editor', window.location.origin);
  fielUrl.hash = hashPath;
  fielUrl.searchParams.set('shell_domain', '*.adobeaemcloud.com')
  if (pocVersion) {
      fielUrl.searchParams.set('aem-extensibility-uex-asset-picker_version', pocVersion);
  }

  return fielUrl.href;
}

module.exports = {
  assetSelectedEventName: 'assetSelected',
  localStorageUrlField: 'assetSelectorConfig',
  buildUrl: buildUrl,
  extensionId: 'eaemrdeueexthello',
  RICHTEXT_TYPE: 'richtext',
  BROADCAST_CHANNEL_NAME: 'eaem-events-channel',
  EVENT_AUE_UI_SELECT: 'aue:ui-select',
  EVENT_AUE_UI_UPDATE: 'aue:content-update'
}