(function ($, $document) {
    "use strict";

    const METADATA_EDITOR_PAGE = "/mnt/overlay/dam/gui/content/assets/metadataeditor.external.html",
        UMAPI_USERS_URL = "/bin/eaem/umapi/users",
        DAM_ROLES_NAME = "./jcr:content/metadata/dam:roles",
        DAM_ROLES_SELECTOR = '[data-granite-coral-multifield-name="./jcr:content/metadata/dam:roles"]';

    let usersJson = {};

    if (isMetadataEditPage()) {
        $document.on("foundation-contentloaded", addPickerInDamRolesWidget);
    }

    function addPickerInDamRolesWidget(){
        $.ajax(UMAPI_USERS_URL).done( json => {
            usersJson = json;
        });

        $(DAM_ROLES_SELECTOR).on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, (mfItem) => {
                const $autoComplete = $(mfItem).find("coral-multifield-item-content").html(getUsersAutoComplete()).find("coral-autocomplete");
                Coral.commons.ready($autoComplete[0], (autoComplete) => {
                    autoComplete._elements["inputGroup"].style.width = "100%";
                    autoComplete._elements["trigger"].style.marginRight = "15px"
                });
            });
        });
    }

    function getUsersAutoComplete(){
        let userWidget = `<coral-autocomplete placeholder="Select user" match="startswith" name="${DAM_ROLES_NAME}" style="width:50px">`;

        for (const email in usersJson) {
            userWidget = userWidget + `<coral-autocomplete-item value='${usersJson[email]}'>${email}</coral-autocomplete-item>`;
        }

        userWidget = userWidget + '</coral-autocomplete>';

        return userWidget;
    }

    function isMetadataEditPage() {
        return (window.location.pathname.indexOf(METADATA_EDITOR_PAGE) >= 0);
    }

}(jQuery, jQuery(document)));