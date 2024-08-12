(function ($, $document) {
    "use strict";

    let ASSETS_PAGE = "/assets.html",
        initialized = false,
        BESIDE_ACTIVATOR = "button.cq-damadmin-admin-actions-downloadcf-activator",
        INDESIGN_ACTIVATOR = "button.eaem-to-indesign-activator",
        FOU_COL_ACT_HIDDEN = "foundation-collection-action-hidden",
        ID_BUTTON_URL = "/apps/eaem-assets-cf-indesign/clientlibs/content/create-indesign-doc-but.html";

    if (!isAssetsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        $.ajax(ID_BUTTON_URL).done(addToIndesignButton);
    }

    function addToIndesignButton(html) {
        const $eActivator = $(BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        html = '<coral-actionbar-item class="_coral-ActionBar-item" style="">' + html + '</coral-actionbar-item>';

        let $inDesignBut = $(html).insertAfter($eActivator.closest("coral-actionbar-item"));

        $inDesignBut.find("coral-button-label").css("padding-left", "7px");

        $inDesignBut.click(() => {
            const actionUrl = $(".foundation-selections-item").first().data("foundation-collection-item-id") + ".createInDesignDoc";

            $.ajax(actionUrl).done(() => {
                $(window).adaptTo("foundation-ui").alert("InDesign", "InDesign and PDF documents creation in progress...", "success");
            });
        });

        $document.on("foundation-selections-change", function(){
            let $inDesignBut = $(INDESIGN_ACTIVATOR),
                $selections = $(".foundation-selections-item");

            if($selections.length !== 1){
                return;
            }

            $inDesignBut.removeClass(FOU_COL_ACT_HIDDEN);
        });
    }

    function createIndesignDoc(){

    }

    function isAssetsPage() {
        return (window.location.pathname.indexOf(ASSETS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));