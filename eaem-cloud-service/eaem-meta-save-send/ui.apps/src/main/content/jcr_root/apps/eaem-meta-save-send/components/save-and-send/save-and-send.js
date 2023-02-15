(function ($, $document) {
    "use strict";

    const METADATA_EDITOR_PAGE = "/mnt/overlay/dam/gui/content/assets/metadataeditor.external.html",
            EAEM_SEND_TO_THIRD_PARTY = "eaem-send-to-third-party",
            DONE_ACTIVATOR_SEL = "#shell-propertiespage-doneactivator",
            SAVE_ACTIVATOR_SEL = "#shell-propertiespage-saveactivator";

    if (isMetadataEditPage()) {
        $document.on("foundation-contentloaded", addMetadataSend);
    }

    function addMetadataSend(){
        let $sendButton = $(getSendButton()).appendTo($(SAVE_ACTIVATOR_SEL).parent());

        $sendButton.click(() => {
            const $metaForm = $("#" + $(SAVE_ACTIVATOR_SEL).attr("form"));
            $metaForm.append('<input type="hidden" name="' + EAEM_SEND_TO_THIRD_PARTY + '" value="true"/>');
            $(DONE_ACTIVATOR_SEL).click();
        });
    }

    function getSendButton(){
        return '<button is="coral-buttonlist-item">Save Send & Close</button>'
    }

    function isMetadataEditPage() {
        return (window.location.pathname.indexOf(METADATA_EDITOR_PAGE) >= 0);
    }

}(jQuery, jQuery(document)));