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
        const locPath = window.location.pathname,
            folderPath = locPath.substring(locPath.indexOf(METADATA_EDITOR_PAGE) + METADATA_EDITOR_PAGE.length) + "/jcr:content.json";

        $.ajax(folderPath).done((folderJson) => {
            let eaemWatch = folderJson[EAEM_WATCH] || [];
            $("form").find(ORDERABLE_SEL).after(getWatchCheckBox(eaemWatch && eaemWatch.includes(getLoggedInUserID())));
        })
    }

    function getWatchCheckBox(isWatching){
        const checked = isWatching ? " checked " : " ";
        return '<coral-checkbox ' + checked + ' name="' + EAEM_WATCH + '" value="true" class="coral-Form-field _coral-Checkbox">Watch</coral-checkbox>';
    }

    function isFolderProperties() {
        return (window.location.pathname.indexOf(METADATA_EDITOR_PAGE) >= 0);
    }

    function getLoggedInUserID(){
        return window.sessionStorage.getItem("granite.shell.badge.user");
    }
}(jQuery, jQuery(document)));