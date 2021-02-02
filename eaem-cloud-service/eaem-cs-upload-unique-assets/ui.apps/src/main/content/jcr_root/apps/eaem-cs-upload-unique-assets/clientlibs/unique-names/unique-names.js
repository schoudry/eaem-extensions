(function ($, $document) {
    "use strict";

    var _ = window._;

    var _origConfirmUpload = window.DamFileUpload.prototype._confirmUpload,
        _origOnInputChange = window.Dam.ChunkFileUpload.prototype._onInputChange;

    window.Dam.ChunkFileUpload.prototype._onInputChange = function(event){
        var files = event.target.files;

        if(!files && event.dataTransfer && event.dataTransfer.files){
            files = event.dataTransfer.files;
        }

        if(_.isEmpty(files)){
            _origOnInputChange.call(this, event);
            return;
        }

        var validFiles = [];

        _.each(files, function(file) {
            validFiles.push(file.name);
        });

        var existInDAMFiles = checkFilesExist(validFiles);

        if(!_.isEmpty(existInDAMFiles)){
            showAlert("Following files exist : <BR> <BR> " + existInDAMFiles.join("<BR>") + "</b>");
            return;
        }

        _origOnInputChange.call(this, event);
    };

    window.DamFileUpload.prototype._confirmUpload = function (event) {
        var existInDAMFiles = checkFilesExist(this.fileUpload.uploadQueue.map(hit => hit.path));

        if(!_.isEmpty(existInDAMFiles)){
            showAlert("Following files exist : <BR> <BR> " + existInDAMFiles.join("<BR>") + "</b>");
            return;
        }

        _origConfirmUpload.call(this, event);

        var uploadDialog = this.uploadDialog;

        _.defer(function(){
            $(uploadDialog).find("input").attr("disabled", "disabled");
        },0)
    };

    function checkFilesExist(fileNames){
        var existingFiles = [],
            url = "/bin/experience-aem/duplicates?";

        _.each(fileNames, function(fileName, index){
            url = url + "fileName=" + fileName + "&";
        });

        $.ajax( { url : url, async : false, contentType:"application/json" }).done(function(data){
            existingFiles = data;
        }).fail(function() {
            showAlert("Error occured while checking for duplicates", "Error");
        });

        return existingFiles;
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
