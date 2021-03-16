(function($, $document) {
    var EAEM_REVERT_CSS = "eaem-revert-toversion-file-only",
        REVERT_FILE_NOT_METADATA_TITLE = "Revert and retain latest metadata",
        REVERT_FILE_AND_METADATA_TITLE = "Revert and overwrite metadata",
        TIME_LINE_EVENT_CSS = ".cq-common-admin-timeline-event",
        EAEM_VERSION_NAME = "eaem-version-name",
        EAEM_VERSION_PATH = "eaem-version-path",
        ASSET_DETAILS_PAGE_URL = "/assetdetails.html",
        REVERT_TO_VERSION_SEL = ".cq-common-admin-timeline-event-button",
        versionFileName;

    $document.on("click", TIME_LINE_EVENT_CSS, addDownloadVersion);

    function addDownloadVersion(){
        var $timeLineButton = $(this).find(REVERT_TO_VERSION_SEL);

        $(getDownloadButtonHtml()).appendTo($timeLineButton.closest("form")).click(downloadVersion);
    }

    function downloadVersion(){
        var $section = $(this).closest("section"),
            versionPath = $section.data("preview");
        versionPath = versionPath.substring(0, versionPath.indexOf("/jcr:frozenNode"));

        window.open("/bin/downloadVersion?resource=" + versionPath, '_blank');
    }

    function getDownloadButtonHtml(){
        return '<button is="coral-button" class="coral3-Button coral3-Button--secondary" type="button" size="M" variant="secondary">' +
                    '<coral-button-label>Download Version</coral-button-label>' +
                '</button>'
    }
})(jQuery, jQuery(document));