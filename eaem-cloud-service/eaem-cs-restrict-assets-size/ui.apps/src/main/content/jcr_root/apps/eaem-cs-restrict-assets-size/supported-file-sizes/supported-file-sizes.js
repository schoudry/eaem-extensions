(function ($, $document) {
    "use strict";

    var _ = window._,
        S7_FOLDER_LENGTH_MAX = 240,
        CONTENT_DAM_PATH = "/content/dam",
        ERROR_MSG = "Unsupported file extensions : ";

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

        if(!isS7RelativeFolderPathWithinLimit()){
            showAlert("File Path exceeds maximum allowed length");
            return;
        }

        var invalidFileNames = [], validFileNames = [],
            FILE_EXTS_SUPPORTED = getSuppportedFileExtensions();

        _.each(files, function(file){
            var fileName = file.name;

            if(!fileName.includes(".")){
                invalidFileNames.push(fileName);
                return;
            }

            var ext = fileName.substring(fileName.lastIndexOf(".") + 1);

            if(!FILE_EXTS_SUPPORTED.includes(ext.toUpperCase())){
                invalidFileNames.push(fileName);
            }else{
                validFileNames.push(fileName);
            }
        });

        if(_.isEmpty(invalidFileNames)){
            var existInDAMFiles = checkFilesExist(validFileNames);

            if(!_.isEmpty(existInDAMFiles)){
                showAlert("Following files exist : <BR> <BR> " + existInDAMFiles.join("<BR>") + "</b>");
                return;
            }

            _origOnInputChange.call(this, event);
        }else{
            showAlert(ERROR_MSG + "<b>" + invalidFileNames.join(",") + "</b>");
        }
    };

    window.DamFileUpload.prototype._confirmUpload = function (event) {
        var invalidFileNames = [], validFileNames = [],
            FILE_EXTS_SUPPORTED = getSuppportedFileExtensions();

        if(!isS7RelativeFolderPathWithinLimit()){
            showAlert("File Path exceeds maximum allowed length");
            return;
        }

        this.fileUpload.uploadQueue.forEach(function(item) {
            var fileName = item.name;

            if(!fileName.includes(".")){
                invalidFileNames.push(fileName);
                return;
            }

            var ext = fileName.substring(fileName.lastIndexOf(".") + 1);

            if(!FILE_EXTS_SUPPORTED.includes(ext.toUpperCase())){
                invalidFileNames.push(fileName);
            }else{
                validFileNames.push(fileName);
            }
        });

        if(_.isEmpty(invalidFileNames)){
            var existInDAMFiles = checkFilesExist(validFileNames);

            if(!_.isEmpty(existInDAMFiles)){
                showAlert("Following files exist : <BR> <BR> " + existInDAMFiles.join("<BR>") + "</b>");
                return;
            }

            _origConfirmUpload.call(this, event);

            var uploadDialog = this.uploadDialog;

            _.defer(function(){
                $(uploadDialog).find("input").attr("disabled", "disabled");
            },0)
        }else{
            showAlert(ERROR_MSG + "<b>" + invalidFileNames.join(",") + "</b>");
        }
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

    function checkFilesExist(fileNames){
        var existingFiles = [],
            url = "/bin/dp-vision-dam/duplicates?";

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

    function getSuppportedFileExtensions(){
        return [
            "JPG", "JPEG", "XLSX", "DOCX", "GIF", "PNG", "TIF", "TIFF", "BMP", "PDF", "PSD", "PSB", "EPS", "AI",
            "PS", "AFM", "OTF", "PFB", "PFM", "TTC", "TTF", "ICC", "ICM", "VNC",
            "VNT","VNW","FLA","FLV","SWF","SVG","SVGX","INDD","INDT","DOC","PPT", "WEBM", "WAV", "MP3", "JSON",
            "RTF","XLS","FXG","XML","XSL","XSLT","TXT","AVI","GXF","LXF","MOV","MP4","MXF","VOB","TAR","AEP"
        ];
    }
}(jQuery, jQuery(document)));
