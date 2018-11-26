(function ($, $document) {
    "use strict";

    var _ = window._,
        PATTERN = /^[a-z0-9_\-.]+$/,
        ERROR_MSG = "Acceptable characters in file name are lowercase alphabets, numbers, underscore and hyphen <b>" + PATTERN + "</b>",
        UPLOAD_DIALOG_CLASS = ".uploadListDialog",
        registered = false;
    
    $document.on("foundation-contentloaded", handleFileNames);

    function handleFileNames() {
        if(registered){
            return;
        }

        registered = true;

        var $fileUpload = $("coral-chunkfileupload");

        $fileUpload.on('change', checkFileNames);
    }

    function checkFileNames(event) {
        var $uploadDialog = $(UPLOAD_DIALOG_CLASS);

        if(_.isEmpty($uploadDialog)){
            return;
        }

        var fileUpload = this;

        $uploadDialog.each(function(index, uploadDialog){
            if(!uploadDialog.open){
                return;
            }

            if(_.isEmpty(getInvalidFileNames(fileUpload))){
                return;
            }

            uploadDialog.hide();

            showAlert(ERROR_MSG);
        });
    }

    function getInvalidFileNames(fileUpload){
        var invalidFileNames = [];

        if(!fileUpload || _.isEmpty(fileUpload.uploadQueue)){
            return invalidFileNames;
        }

        _.each(fileUpload.uploadQueue, function(file){
            if(!PATTERN.test(file.name)){
                invalidFileNames.push(file.name)
            }
        });

        return invalidFileNames;
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "warning", options, callback);
    }
}(jQuery, jQuery(document)));
