(function ($, $document) {
    var _ = window._,
        INBOX_UI_PAGE_VANITY = "/aem/inbox",
        INBOX_UI_PAGE = "/mnt/overlay/cq/inbox/content/inbox.html",
        PAYLOAD_URL = "/mnt/overlay/cq/core/content/projects/showtasks/reviewtd/payload.html",
        REVIEW_TASK_PAGE = "reviewtd.html";

    function isInboxPage() {
        var pathName = window.location.pathname;
        return ((pathName.indexOf(INBOX_UI_PAGE) >= 0) || (pathName.indexOf(INBOX_UI_PAGE_VANITY) >= 0));
    }

    function getContentUrl(url){
        return url.substring(url.indexOf(REVIEW_TASK_PAGE) + REVIEW_TASK_PAGE.length, url.indexOf("?") );
    }

    function linkHandler(name, el, config, collection, selections){
        var linkAttrName = config.data.linkAttributeName,
            itemId, reviewTDUrl, content, url;

        if(_.isEmpty(linkAttrName)){
            return;
        }

        itemId = $(selections).data("foundationCollectionItemId");
        reviewTDUrl = $(selections).data(linkAttrName);
        content = getContentUrl(reviewTDUrl);
        url = PAYLOAD_URL + content + "?item=" + itemId + "&content=" + content + "&_charset_=utf-8";

        if (config.data.target) {
            window.open(url, config.data.target);
        } else {
            window.location = url;
        }
    }

    function changeViewPayloadTarget(){
        if(!isInboxPage()){
            return;
        }

        $(window).adaptTo("foundation-registry").register("foundation.collection.action.action", {
            name: "cq.inbox.openlink",
            handler: linkHandler
        });
    }

    $document.on("foundation-contentloaded", changeViewPayloadTarget);
}(jQuery, jQuery(document)));