(function ($, $document) {
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded";

    $document.on(FOUNDATION_CONTENT_LOADED, function () {
        var coralShell = $("coral-shell-content")[0];

/*
        coralShell.removeEventListener('dragenter');
        coralShell.addEventListener("dragenter", showDisabledMessage);
*/
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