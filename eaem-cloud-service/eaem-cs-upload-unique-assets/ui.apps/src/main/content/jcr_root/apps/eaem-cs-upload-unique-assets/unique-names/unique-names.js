(function ($, $document) {
    "use strict";

    var _ = window._,
        ERROR_MSG = "Unsupported file extensions : ";

    var _origConfirmUpload = window.DamFileUpload.prototype._confirmUpload;

    window.DamFileUpload.prototype._confirmUpload = function (event) {
        var invalidFileNames = [],
            FILE_EXTS_SUPPORTED = getSuppportedFileExtensions();

        this.fileUpload.uploadQueue.forEach(function(item) {
            var fileName = item.name;

            if(!fileName.includes(".")){
                invalidFileNames.push(fileName);
                return;
            }

            var ext = fileName.substring(fileName.lastIndexOf(".") + 1);

            if(!FILE_EXTS_SUPPORTED.includes(ext.toUpperCase())){
                invalidFileNames.push(fileName);
            }
        });

        if(_.isEmpty(invalidFileNames)){
            _origConfirmUpload.call(this, event);

            var uploadDialog = this.uploadDialog;

            _.defer(function(){
                $(uploadDialog).find("input").attr("disabled", "disabled");
            },0)
        }else{
            showAlert(ERROR_MSG + "<b>" + invalidFileNames.join(",") + "</b>");
        }
    };

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

    function getSuppportedFileExtensions(){
        return [
            "JPG", "PNG"
        ];
    }
}(jQuery, jQuery(document)));
