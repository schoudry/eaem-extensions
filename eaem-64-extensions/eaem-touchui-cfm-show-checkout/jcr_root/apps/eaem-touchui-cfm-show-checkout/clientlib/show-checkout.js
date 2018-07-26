(function ($, $document) {
    var LOCK_ITEM_CSS = "eaem-cf-lock";

    $document.on("foundation-contentloaded", checkForDriveLock);

    function checkForDriveLock(){
        $.ajax(getCFJCRContentPath()).done(handler);

        function handler(data){
            $("." + LOCK_ITEM_CSS).remove();

            var driveLock = data["cq:drivelock"];

            if(_.isEmpty(driveLock)){
                return;
            }

            addCheckOutButton(driveLock);

            if(getLoggedInUserID() != driveLock){
                showAlert("Locked for editing by " + driveLock + ", changes cannot be saved", "Editor");
            }
        }
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

    function addCheckOutButton(driveLock){
        var message = "Locked by " + ( getLoggedInUserID() == driveLock ? "current user - " : "- ") + driveLock;

        var html = '<coral-actionbar-item class="coral3-ActionBar-item ' + LOCK_ITEM_CSS + '">'
                    + '<coral-icon style="margin:16px 10px 0 0; " class="coral3-Icon coral3-Icon--sizeS coral3-Icon--lockOn" icon="lockOn" size="S"></coral-icon>'
                    + '<span>' + message + '</span>'
                    + '</coral-actionbar-item>';

        $("coral-actionbar-primary").append(html);
    }

    function getLoggedInUserID(){
        return window.sessionStorage.getItem("granite.shell.badge.user");
    }

    function getCFJCRContentPath(){
        return $(".content-fragment-editor").data("fragment") + "/_jcr_content.json";
    }
}(jQuery, jQuery(document)));