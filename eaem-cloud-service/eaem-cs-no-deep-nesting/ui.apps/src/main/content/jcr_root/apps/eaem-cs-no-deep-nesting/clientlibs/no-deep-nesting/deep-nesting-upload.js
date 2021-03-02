(function ($, $document) {
    "use strict";

    var _ = window._,
        S7_FOLDER_LENGTH_MAX = 240,
        CONTENT_DAM_PATH = "/content/dam";

    var _origConfirmUpload = window.DamFileUpload.prototype._confirmUpload,
        _origOnInputChange = window.Dam.ChunkFileUpload.prototype._onInputChange;

    window.Dam.ChunkFileUpload.prototype._onInputChange = function(event){
        var files = event.target.files;

        if(!files && event.dataTransfer && event.dataTransfer.files){
            files = event.dataTransfer.files;
        }

        if(!files || (files.length == 0)){
            _origOnInputChange.call(this, event);
            return;
        }

        if(!isS7RelativeFolderPathWithinLimit()){
            showAlert("Uploading to deep nested folders not allowed");
            return;
        }

        _origOnInputChange.call(this, event);
    };

    window.DamFileUpload.prototype._confirmUpload = function (event) {
        if(!isS7RelativeFolderPathWithinLimit()){
            showAlert("Uploading to deep nested folders not allowed");
            return;
        }

        _origConfirmUpload.call(this, event);
    };

    function isS7RelativeFolderPathWithinLimit(){
        var folderPath = window.location.pathname;

        if(folderPath.includes("/content/dam")){
            folderPath = folderPath.substring(folderPath.indexOf(CONTENT_DAM_PATH) + CONTENT_DAM_PATH.length);
        }

        return (folderPath.length <= S7_FOLDER_LENGTH_MAX);
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
