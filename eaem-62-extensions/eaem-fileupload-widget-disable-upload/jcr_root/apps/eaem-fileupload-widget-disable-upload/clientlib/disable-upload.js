(function ($, $document, gAuthor) {
    var COMPONENT = "foundation/components/image",
        FILE_UPLOAD = ".coral-FileUpload",
        FILE_UPLOAD_BROWSE = ".cq-FileUpload-browse",
        DATA_ATTR_FILE_UPLOAD = "fileUpload";

    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', disableUpload);

    function disableUpload(){
        var editable = gAuthor.DialogFrame.currentDialog.editable;

        //if not an image component dialog, return
        if((editable.type !== COMPONENT)){
            return;
        }

        var $fileUploads = $(FILE_UPLOAD), cuiFileUpload, $uploadBrowse;

        $fileUploads.each(function(index, fileUpload){
            cuiFileUpload = $(fileUpload).data(DATA_ATTR_FILE_UPLOAD);

            $uploadBrowse = cuiFileUpload.$element.find(FILE_UPLOAD_BROWSE);

            $uploadBrowse.off().on("click tap", function(){
                showErrorAlert("Upload Disabled");
            });

            cuiFileUpload.$element.find("input[type='file']").remove();
        });
    }

    function showErrorAlert(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "OK",
                warning: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "error", options);
    }
}(jQuery, jQuery(document), Granite.author));