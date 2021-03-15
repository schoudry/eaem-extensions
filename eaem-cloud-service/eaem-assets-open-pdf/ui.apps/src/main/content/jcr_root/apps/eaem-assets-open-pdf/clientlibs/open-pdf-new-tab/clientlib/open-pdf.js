(function ($, $document) {
    "use strict";

    var _ = window._,
        initialized = false,
        ASSETS_PAGE = "/assets.html", $openPDFBut,
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-create-activator",
        OPEN_PDF_BUT_URL = "/apps/eaem-assets-open-pdf/clientlibs/open-pdf-new-tab/open-pdf-but.html";

    if (!isAssetsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    $document.on("foundation-selections-change", ".foundation-collection", enableOpenPDFButton);

    function enableOpenPDFButton(){
        if(!$openPDFBut){
            return;
        }

        var $selections = $(".foundation-selections-item");

        if ($selections.length !== 1) {
            $openPDFBut.addClass("foundation-collection-action-hidden");
            return;
        }

        var mimeType = $selections.find(".foundation-collection-assets-meta").data("asset-mimetype");

        if(mimeType !== "application/pdf"){
            return;
        }

        $openPDFBut.removeClass("foundation-collection-action-hidden");
    }

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        $.ajax(OPEN_PDF_BUT_URL).done(addOpenPDFButton);
    }

    function addOpenPDFButton(html) {
        html = html || "";

        if(!html.trim()){
            return;
        }

        var $eActivator = $("." + BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        $openPDFBut = $("<coral-actionbar-item>" + html + "</coral-actionbar-item>")
                                        .insertAfter($eActivator.closest("coral-actionbar-item"));

        $openPDFBut = $openPDFBut.find("button");

        $openPDFBut.click(openPDFInNewTab);
    }

    function openPDFInNewTab() {
        var $selections = $(".foundation-selections-item"),
            assetPath = $selections.data("foundationCollectionItemId");

        window.open(assetPath, '_blank');
    }

    function isAssetsPage() {
        return (window.location.pathname.indexOf(ASSETS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));
