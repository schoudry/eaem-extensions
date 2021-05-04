(function ($, $document) {
    "use strict";

    var _ = window._,
        CONFIG_PATH = "/conf/global/settings/dam/eaem-dam-config.json",
        allowedSizes = {},
        ENDS_WITH_SIZE = "Size";

    loadAllowedSizes();

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

        var errorMessage = "";

        _.each(files, function(file){
            var fileErrorMessage = checkWithinSize(file);

            if(!fileErrorMessage){
                return;
            }

            errorMessage = errorMessage + fileErrorMessage + "<BR>";
        });

        if(errorMessage){
            showAlert(errorMessage);
        }else{
            _origOnInputChange.call(this, event);
        }
    };

    window.DamFileUpload.prototype._confirmUpload = function (event) {
        var errorMessage = "";

        this.fileUpload.uploadQueue.forEach(function(item) {
            var fileErrorMessage = checkWithinSize(item);

            if(!fileErrorMessage){
                return;
            }

            errorMessage = errorMessage + fileErrorMessage + "<BR>";
        });

        if(errorMessage){
            showAlert(errorMessage);
        }else{
            _origConfirmUpload.call(this, event);
        }
    };

    function checkWithinSize(file){
        var fileName = file.name, errorMessage = "";

        if(!fileName.includes(".")){
            return;
        }

        var ext = fileName.substring(fileName.lastIndexOf(".") + 1);

        _.each(allowedSizes, function(allowedSize, fileType){
            if(fileType !== ext){
                return;
            }

            if(file.size > allowedSize){
                errorMessage = "<b>" + fileName + "</b> size <b>" + formatBytes(file.size, 2)
                    + "</b> is more than allowed <b>" + formatBytes(allowedSize, 2) + "</b>";
            }
        });

        return errorMessage;
    }

    function loadAllowedSizes(){
        $.ajax(CONFIG_PATH).done(function(data){
            if(_.isEmpty(data)){
                return;
            }

            _.each(data, function(value, key){
                if(!key.endsWith(ENDS_WITH_SIZE)){
                    return;
                }

                allowedSizes[key.substring(0, key.lastIndexOf(ENDS_WITH_SIZE))] = parseInt(value);
            })
        })
    }

    function formatBytes(bytes, decimals) {
        if (bytes === 0){
            return '0 Bytes';
        }

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
