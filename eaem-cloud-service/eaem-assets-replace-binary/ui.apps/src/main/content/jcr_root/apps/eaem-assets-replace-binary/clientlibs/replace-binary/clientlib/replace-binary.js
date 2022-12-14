(function ($, $document) {
    "use strict";

    var ASSET_DETAILS_PAGE = "/assetdetails.html",
        BESIDE_ACTIVATOR = "cq-damadmin-admin-actions-download-activator",
        REPLACE_BINARY_BUT_URL = "/apps/eaem-assets-replace-binary/clientlibs/replace-binary/content/replace-binaryl-but.html",
        REPLACE_BINARY_URL = "/apps/eaem-assets-replace-binary/clientlibs/replace-binary/replace-binary-dialog.html",
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        DEST_ASSET_FIELD = "destAsset",
        SRC_ASSET_FIELD_SEL = "[name='srcAsset']",
        url = document.location.pathname,
        initialized = false, $replaceBinaryModal;

    if (isAssetDetailsPage()) {
        $document.on("foundation-contentloaded", addActionBarButtons);
    }else if(url.indexOf(REPLACE_BINARY_URL) == 0){
        $document.on("foundation-contentloaded", handleReplaceBinaryDialog);
        $document.on("click", CANCEL_CSS, sendCancelMessage);
        $document.submit( () => {
            const fui = $(window).adaptTo("foundation-ui");
            let srcAsset = $ (SRC_ASSET_FIELD_SEL).find("input").val();

            if(!srcAsset){
                fui.alert("Error","Select the source asset", "error");
            }else{
                fui.alert("Success","Replace binary action initiated. You'll be notified on successful completion");
                setTimeout(sendCancelMessage, 3000);
            }
        });
    }

    function addActionBarButtons(){
        if (initialized) {
            return;
        }

        initialized = true;

        $.ajax(REPLACE_BINARY_BUT_URL).done(addReplaceBinaryButton);
    }

    function addReplaceBinaryButton(html){
        var $eActivator = $("." + BESIDE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $replaceBinaryBut = $(html).insertAfter($eActivator);

        $replaceBinaryBut.find("coral-button-label").css("padding-left", "7px");
        $replaceBinaryBut.click(openReplaceBinaryModal);
        $(window).off('message', closeReplaceBinaryModal).on('message', closeReplaceBinaryModal);
    }

    function handleReplaceBinaryDialog(){
        var $form = $("form");

        $('<input />').attr('type', 'hidden').attr('name', DEST_ASSET_FIELD)
            .attr('value', getParent().location.pathname.substring(ASSET_DETAILS_PAGE.length)).appendTo($form);
    }

    function sendCancelMessage(){
        var message = {
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function openReplaceBinaryModal(){
        var $iframe = $('<iframe>'),
            $modal = $('<div>').addClass('eaem-replace-binary-apply-modal coral-Modal');

        $iframe.attr('src', REPLACE_BINARY_URL).appendTo($modal);

        $modal.appendTo('body').modal({
            type: 'default',
            buttons: [],
            visible: true
        });

        $replaceBinaryModal = $modal;
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function closeReplaceBinaryModal(event){
        event = event.originalEvent || {};

        if (_.isEmpty(event.data) || _.isEmpty($replaceBinaryModal)) {
            return;
        }

        var message;

        try { message = JSON.parse(event.data); }catch(e){ return; }

        if (!message || message.action !== "cancel") {
            return;
        }

        var modal = $replaceBinaryModal.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function isAssetDetailsPage() {
        return (window.location.pathname.indexOf(ASSET_DETAILS_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));