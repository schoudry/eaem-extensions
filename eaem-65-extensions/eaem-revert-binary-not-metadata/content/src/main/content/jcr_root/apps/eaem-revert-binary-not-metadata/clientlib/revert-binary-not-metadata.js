(function($, $document) {
    var EAEM_REVERT_CSS = "eaem-revert-toversion-file-only",
        REVERT_FILE_NOT_METADATA_TITLE = "Revert to this Version (File)",
        REVERT_TO_VERSION_SEL = ".cq-common-admin-timeline-event-button";

    $document.on("foundation-contentloaded", addRevertToThisVersionFile);

    function addRevertToThisVersionFile(){
        getUIWidget(REVERT_TO_VERSION_SEL).then(function($timeLineButton){
            if(!_.isEmpty($("." + EAEM_REVERT_CSS))){
                return;
            }

            $(getButtonHtml()).insertAfter($timeLineButton).click(revertToVersion);
        });
    }

    function getButtonHtml(){
        return '<button is="coral-button" class="' + EAEM_REVERT_CSS + '" size="M" variant="secondary" style="width:100%; margin-top:.2rem">' +
                    '<coral-button-label>' + REVERT_FILE_NOT_METADATA_TITLE + '</coral-button-label>' +
               '</button>'
    }

    function revertToVersion(event){
        event.preventDefault();

        var $form = $(this).closest("form"),
            $otbRevert = $(this).prev(REVERT_TO_VERSION_SEL);

        $form.append("<input type='hidden' name='" + EAEM_REVERT_CSS + "' value='true'/>");

        $otbRevert.click();
    }

    function getUIWidget(selector){
        if(_.isEmpty(selector)){
            return;
        }

        var deferred = $.Deferred();

        var INTERVAL = setInterval(function(){
            var $widget = $(selector);

            if(_.isEmpty($widget)){
                return;
            }

            clearInterval(INTERVAL);

            deferred.resolve($widget);
        }, 250);

        return deferred.promise();
    }
})(jQuery, jQuery(document));