(function ($, $document) {
    "use strict";

    let ASSETS_PAGE = "/assets.html",
        initialized = false,
        BESIDE_ACTIVATOR = "button.cq-damadmin-admin-actions-publicLinkShare-activator",
        PP_ACTIVATOR = "button.eaem-protected-link-activator",
        FOU_COL_ACT_HIDDEN = "foundation-collection-action-hidden",
        MODAL_URL = "/apps/eaem-link-share-pass-protected/clientlibs/content/pl-dialog.html",
        BUTTON_URL = "/apps/eaem-link-share-pass-protected/clientlibs/content/protected-link-but.html";

    let $plModal;

    if (!isAssetsPage()) {
        return;
    }

    $document.on("foundation-contentloaded", addActionBarButtons);

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        $.ajax(BUTTON_URL).done(addButton);
    }

    function addButton(html) {
        const $eActivator = $(BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        html = '<coral-actionbar-item class="_coral-ActionBar-item" style="">' + html + '</coral-actionbar-item>';

        let $but = $(html).insertAfter($eActivator.closest("coral-actionbar-item"));

        $but.find("coral-button-label").css("padding-left", "7px");

        $but.click(openModal);

        $document.on("foundation-selections-change", function(){
            let $but = $(PP_ACTIVATOR),
                $selections = $(".foundation-selections-item");

            if($selections.length !== 1){
                return;
            }

            $but.removeClass(FOU_COL_ACT_HIDDEN);
        });
    }

    function openModal(){
        let $iframe = $('<iframe>'),
            $modal = $('<div>').addClass('eaem-modal coral-Modal');

        $iframe.attr('src', MODAL_URL).appendTo($modal);

        $modal.appendTo('body').modal({
            type: 'default',
            buttons: [],
            visible: true
        });

        $plModal = $modal;
    }

    function isAssetsPage() {
        return (window.location.pathname.indexOf(ASSETS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));