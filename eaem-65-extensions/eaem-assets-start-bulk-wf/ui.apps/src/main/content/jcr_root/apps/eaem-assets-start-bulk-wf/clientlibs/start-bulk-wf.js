(function ($, $document) {
    "use strict";

    const ASSETS_PAGE = "/assets.html",
        FOU_COL_ACT_HIDDEN = "foundation-collection-action-hidden",
        START_BULK_WF_PAGE = "/apps/eaem-assets-start-bulk-wf/components/content/start-bulk-workflow.html",
        START_WF_BUT_URL = "/apps/eaem-assets-start-bulk-wf/components/content/start-bulk-wf-but.html",
        BULK_WF_ACTIVATOR = ".cq-damadmin-admin-actions-eaem-start-bulk-wf-activator",
        SHARE_ACTIVATOR = "cq-damadmin-admin-actions-adhocassetshare-activator";

    if(isEaemBulkWfPage()){
        $document.on("foundation-contentloaded", addSrcPathList);
    }else if(isAssetsPage()) {
        $document.on("foundation-selections-change", function(){
            let $startWfBut = $(BULK_WF_ACTIVATOR);

            if(!_.isEmpty($startWfBut)){
                const $items = $(".foundation-selections-item");

                if(_.isEmpty($items)){
                    $startWfBut.removeClass(FOU_COL_ACT_HIDDEN);
                }else{
                    $startWfBut.addClass(FOU_COL_ACT_HIDDEN);
                }

                return;
            }

            $.ajax(START_WF_BUT_URL).done(addActionBarButton);
        });
    }

    function addSrcPathList(){
        let $form = $("form");

        _.each(queryParameters().paths.split(","),(path) => {
            $form.append($("<input type='hidden'/>").attr("name", "srcPathList").attr("value", path));
        });
    }

    function addActionBarButton(html){
        const $eActivator = $("." + SHARE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        let $startWfBut = $(html).css("margin-left", "20px").insertBefore($eActivator);

        $startWfBut.click(openStartWfPage);
    }

    function openStartWfPage(){
        const $items = $(".foundation-selections-item"),
            assetPaths = [];

        $items.each(function () {
            assetPaths.push($(this).data("foundationCollectionItemId"));
        });

        window.open(START_BULK_WF_PAGE + "?paths=" + assetPaths.join(","), '_blank');
    }

    function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function isEaemBulkWfPage(){
        return (window.location.pathname.indexOf(START_BULK_WF_PAGE) >= 0);
    }

    function isAssetsPage() {
        return (window.location.pathname.indexOf(ASSETS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));