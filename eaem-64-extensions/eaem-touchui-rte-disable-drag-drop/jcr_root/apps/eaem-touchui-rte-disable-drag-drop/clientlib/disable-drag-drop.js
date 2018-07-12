(function () {
    "use strict";

    var _ = window._,
        CUI = window.CUI;

    var otbIsMimeTypeAccepted = CUI.RichText.prototype._isMimeTypeAccepted;

     function disableJpegDragAndDropInRTE(mimeType) {
        if(_.isEmpty(mimeType) || (mimeType != 'image/jpeg') ){
            return otbIsMimeTypeAccepted.apply(this, arguments);
        }

         showAlert("Uh oh! you are restricted from dropping JPEGs", "RTE");

        return false;
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

    CUI.RichText.prototype._isMimeTypeAccepted = disableJpegDragAndDropInRTE;
}());