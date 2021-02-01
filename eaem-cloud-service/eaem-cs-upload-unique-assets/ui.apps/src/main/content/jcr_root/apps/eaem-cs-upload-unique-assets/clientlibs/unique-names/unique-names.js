(function ($, $document) {
    "use strict";

    var _ = window._;

    var _origConfirmUpload = window.DamFileUpload.prototype._confirmUpload;

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
            url = "/bin/querybuilder.json?path=/content/dam&group.p.or=true&";

        _.each(fileNames, function(fileName, index){
            url = url + "group." + index + "_nodename=" + fileName + "&";
        });

        $.ajax( { url : url, async : false }).done(function(data){
            existingFiles = data["hits"].map(hit => hit.path);
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
