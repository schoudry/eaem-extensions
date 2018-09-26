(function ($, $document) {
    "use strict";

    var EDITOR_LOADED_EVENT = "cq-editor-loaded",
        PAGE_INFO_TRIGGER = "#pageinfo-trigger",
        VIEW_AS_PUBLISHED_SEL = ".pageinfo-viewaspublished",
        EAEM_COPY_ID = "eaem-copy-message",
        VIEW_IN_PUBLISH_BUT_URL = "/apps/eaem-touchui-extend-page-info-view-in-publish/ui/view-in-publish.html",
        publishServer = null;

	$document.on(EDITOR_LOADED_EVENT, addViewInPublish);

    function addViewInPublish(){
        $(PAGE_INFO_TRIGGER).on('click', addButtonUI);
    }

    function addButtonUI(){
        getPublishServer();

        $.ajax(VIEW_IN_PUBLISH_BUT_URL).done(function(html){
            $(html).insertAfter($(VIEW_AS_PUBLISHED_SEL)).click(openPublishPage);
        });
    }

    function openPublishPage(){
        if(_.isEmpty(publishServer)){
            return;
        }

        var publishPath = publishServer + Granite.author.ContentFrame.currentLocation(),
            message = "<div id='" + EAEM_COPY_ID + "'>" + publishPath + "</div>";

        showAlert(message, "Open", function(clicked){
            if(clicked == "open"){
                window.open(publishPath);
                return;
            }

            var range = document.createRange();

            range.selectNode(document.getElementById(EAEM_COPY_ID));

            window.getSelection().addRange(range);

            document.execCommand("copy");
        });
    }

    function getPublishServer(){
        $.ajax("/etc/replication/agents.author.2.json").done(successFn);

        function successFn(data){
            var transportUri = data["publish"]["jcr:content"]["transportUri"];

            publishServer = transportUri.substring(0, transportUri.indexOf("/bin/receive"));
        }
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                    id: "copy",
                    text: "Copy to Clipboard"
                },
                {
                    id: "open",
                    text: "Open",
                    primary: true
                }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "info", options, callback);
    }
})(jQuery, jQuery(document));
