(function($, $document) {
    var TIME_LINE_EVENT_CSS = ".cq-common-admin-timeline-event",
        EAEM_VERSION_CSS = "eaem-version",
        REVERT_TO_VERSION_SEL = ".cq-common-admin-timeline-event-button";

    $document.on("click", TIME_LINE_EVENT_CSS, addDownloadVersion);

    function addDownloadVersion(){
        var $timeLineButton = $(this).find(REVERT_TO_VERSION_SEL),
            $timelineForm = $timeLineButton.closest("form");

        if(!_.isEmpty($timelineForm.find("." + EAEM_VERSION_CSS))){
            return;
        }

        $(getDownloadButtonHtml()).appendTo($timelineForm).click(downloadVersion);
    }

    function downloadVersion(){
        var $dataPreview = $(this).closest("[data-preview]"),
            versionPath = $dataPreview.data("preview");

        versionPath = versionPath.substring(0, versionPath.indexOf("/jcr:frozenNode"));

        window.open("/bin/eaem/downloadVersion?resource=" + versionPath, '_blank');
    }

    function getDownloadButtonHtml(){
        return '<button is="coral-button" class="coral3-Button coral3-Button--secondary ' + EAEM_VERSION_CSS +
                    '" type="button" size="M" variant="secondary" style="width:100%; margin-top: 0.2rem;">' +
                    '<coral-button-label>Download Version</coral-button-label>' +
                '</button>'
    }
})(jQuery, jQuery(document));