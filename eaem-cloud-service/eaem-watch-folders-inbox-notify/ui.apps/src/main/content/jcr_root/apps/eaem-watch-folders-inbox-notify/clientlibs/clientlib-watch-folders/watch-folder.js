(function ($, $document) {
    "use strict";

    const METADATA_EDITOR_PAGE = "/mnt/overlay/dam/gui/content/assets/v2/foldersharewizard.html",
        EAEM_WATCH = "eaemWatch",
        ORDERABLE_SEL ="#orderable";

    if (!isFolderProperties()) {
        return;
    }

    $document.on("foundation-contentloaded", addWatchFolder);

    function addWatchFolder(){
        $("form").find(ORDERABLE_SEL).after(getWatchCheckBox());
    }

    function getWatchCheckBox(){
        return '<coral-checkbox name="' + EAEM_WATCH + '" value="true" class="coral-Form-field _coral-Checkbox">Watch</coral-checkbox>';
    }

    function isFolderProperties() {
        return (window.location.pathname.indexOf(METADATA_EDITOR_PAGE) >= 0);
    }

}(jQuery, jQuery(document)));