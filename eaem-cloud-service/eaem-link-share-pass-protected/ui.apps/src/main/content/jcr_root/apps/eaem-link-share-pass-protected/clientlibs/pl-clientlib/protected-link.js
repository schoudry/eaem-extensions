(function ($, $document) {
    "use strict";

    let ASSETS_PAGE = "/assets.html", initialized = false,
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        BESIDE_ACTIVATOR = "button.cq-damadmin-admin-actions-publicLinkShare-activator",
        PP_ACTIVATOR = "button.eaem-protected-link-activator",
        FOU_COL_ACT_HIDDEN = "foundation-collection-action-hidden", OP_URL = "/adobe/repository/;api=operations",
        MODAL_URL = "/apps/eaem-link-share-pass-protected/clientlibs/content/pl-dialog.html",
        actionUrl = "/var/dam/share/",
        BUTTON_URL = "/apps/eaem-link-share-pass-protected/clientlibs/content/protected-link-but.html";

    let $plModal;

    if (isAssetsPage()) {
        $document.on("foundation-contentloaded", addActionBarButtons);
    } else if (isShareLinkModalUrl()) {
        $document.on("foundation-contentloaded", handleModalDialog);
        $document.on("click", CANCEL_CSS, sendCancelMessage);
    }

    function handleSubmit(){
        document.querySelector('form').addEventListener('submit', async (event) => {
            event.preventDefault();

            const response = await fetch('/libs/granite/csrf/token.json');
            const json = await response.json();

            const shareLinkUrl = $("[name='shareLink']")[0].value;
            const shareLinkUrlToken = shareLinkUrl.substring(shareLinkUrl.indexOf("sh=") + 3, shareLinkUrl.lastIndexOf("."))
            actionUrl = actionUrl + shareLinkUrlToken;

            navigator.clipboard.writeText(shareLinkUrl);

            let data = 'shareLinkPassword=' +  $("[name='shareLinkPassword']")[0].value;
            let expirationDate = $("[name='expirationDate']")[0].value;

            if(expirationDate){
                data = data + '&expirationDate=' + expirationDate;
            }

            fetch(actionUrl, {
                method: "POST", headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    'CSRF-Token': json.token
                },
                body: data
            }).then(() => {
                sendCancelMessage();
            })
        });
    }

    function sendCancelMessage() {
        const message = {
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function handleModalDialog() {
        const assetPaths = queryParameters()["items"].split(",");

        let expirationDate = new Date();
        expirationDate.setFullYear(expirationDate.getFullYear() + 1)

        let data = {
            op: "share", allowOriginalDownload: true, expirationDate: expirationDate.toISOString()
        };

        data.target = [];

        assetPaths.forEach(path => {
            data.target.push({"repo:path": path});
        });

        fetch(OP_URL, {
            method: "POST", headers: {
                "Content-Type": "application/vnd.adobe.asset-operation+json"
            }, body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(linkJson => {
                $("[name='shareLink']")[0].value = linkJson.link;
                $("[name='expirationDate']")[0].value = linkJson.expirationDate;
                handleSubmit();
            })
    }

    function addActionBarButtons() {
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

        $but.click(() => {
            openModal();
        });

        $(window).off('message', closeModal).on('message', closeModal);

        $document.on("foundation-selections-change", function () {
            let $but = $(PP_ACTIVATOR), $selections = $(".foundation-selections-item");

            if ($selections.length < 1) {
                return;
            }

            $but.removeClass(FOU_COL_ACT_HIDDEN);
        });
    }

    function openModal() {
        let $iframe = $('<iframe>'), url = MODAL_URL + "?items=",
            $modal = $('<div>').addClass('eaem-modal coral-Modal');

        $(".foundation-selections-item").each(function () {
            url = url + $(this).data("graniteCollectionItemId") + ",";
        })

        url = url.substring(0, url.lastIndexOf(","));

        $iframe.attr('src', url).appendTo($modal);

        $modal.appendTo('body').modal({
            type: 'default', buttons: [], visible: true
        });

        $plModal = $modal;
    }

    function closeModal(event) {
        event = event.originalEvent || {};

        if (!event.data || !$plModal) {
            return;
        }

        let message;

        try {
            message = JSON.parse(event.data);
        } catch (e) {
            return;
        }

        if (!message || message.action !== "cancel") {
            return;
        }

        const modal = $plModal.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function queryParameters() {
        let result = {}, param, params = document.location.search.split(/\?|\&/);

        params.forEach(function (it) {
            if (!it) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function isAssetsPage() {
        return (window.location.pathname.indexOf(ASSETS_PAGE) >= 0);
    }

    function isShareLinkModalUrl() {
        return (window.location.pathname.indexOf(MODAL_URL) === 0);
    }
}(jQuery, jQuery(document)));