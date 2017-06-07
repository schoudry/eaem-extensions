(function ($, $document) {
    "use strict";

    $document.on("foundation-contentloaded", function () {
        $document.off("dropzonedragover", "span.coral-FileUpload");
        $document.on("dropzonedragover", "span.coral-FileUpload", showDisabledMessage);

        //triggered by coral when dropped files are added in queue and ready to process
        $document.off("filelistprocessed", "span.coral-FileUpload")
                        .on("filelistprocessed", "span.coral-FileUpload", clearAndRefresh);
    });

    function clearAndRefresh(event){
        var fileUpload = event.fileUpload;

        if(fileUpload && (fileUpload.isDragOver === true)){
            fileUpload.uploadQueue.splice(0, fileUpload.uploadQueue.length);
            $(".foundation-content").adaptTo("foundation-content").refresh();
        }
    }

    function showDisabledMessage() {
        var message = $('<div class=\"drag-drop-message\"><h1>'
                            + '<span>{</span>Drop from desktop disabled<span>}</span>' +
                        '</h1></div>');
        $('.foundation-collection-container').overlayMask('show', message);
    }
})(jQuery, $(document));