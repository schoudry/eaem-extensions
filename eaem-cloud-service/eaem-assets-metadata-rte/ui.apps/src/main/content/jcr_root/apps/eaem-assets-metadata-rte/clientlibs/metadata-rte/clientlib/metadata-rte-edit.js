(function ($, $document) {
    "use strict";

    const METADATA_EDITOR_PAGE = "/mnt/overlay/dam/gui/content/assets/metadataeditor.external.html",
        META_RTE_URL = "/apps/eaem-assets-metadata-rte/components/extensions/metadata-rte/rte-modal.html",
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        RTE_VALUE_SEL = "[name='./text']",
        RICH_TEXT_EDITABLE = ".cq-RichText-editable",
        url = document.location.pathname,
        DATA_RTE_INSTANCE = "rteinstance",
        MULTI_LINE_TEXT_SEL = ".aem-assets-metadata-form-column textarea";

    let $rteModal;

    if (isMetadataEditPage()) {
        $document.on("foundation-contentloaded", addRichTextButtonToTMultiLineText);
    }else if(url.indexOf(META_RTE_URL) == 0){
        $document.on("foundation-contentloaded", initRTE);
        $document.on("click", CANCEL_CSS, sendCancelMessage);
        $document.submit(postRTEContent);
    }

    function initRTE(){
        const queryParams = queryParameters();

        const INIT_INTERVAL = setInterval(() =>{
            const rteInstance = $(RICH_TEXT_EDITABLE).data(DATA_RTE_INSTANCE);

            if(rteInstance && rteInstance.editorKernel){
                rteInstance.setContent(decodeURIComponent(queryParams.content));
                clearInterval(INIT_INTERVAL);
            }
        }, 500);
    }

    function postRTEContent(){
        const queryParams = queryParameters(),
            rteInstance = $(RICH_TEXT_EDITABLE).data(DATA_RTE_INSTANCE);

        let message = {
            action: "save",
            name: decodeURIComponent(queryParams.name),
            content: rteInstance ? rteInstance.getContent() : $(RTE_VALUE_SEL).val()
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function addRichTextButtonToTMultiLineText() {
        let $multiLines = $(MULTI_LINE_TEXT_SEL);

        if ($multiLines.length === 0) {
            return;
        }

        _.each($multiLines, (multiLine) => {
            const $multiline = $(multiLine);

            const editInRTE = new Coral.Button().set({
                variant: 'secondary',
                innerText: "Open Editor"
            });

            $(editInRTE).click((event) => {
                event.preventDefault();
                openRTEModal($multiline.attr("name"), $multiline.val());
            });

            $multiline.closest(".coral-Form-fieldwrapper").append(editInRTE);
        })

        addRTEDataListener();

        $(window).off('message', closeRTEModal).on('message', closeRTEModal);
    }

    function addRTEDataListener(){
        $(window).off('message', receiveMessage).on('message', receiveMessage);

        function receiveMessage(event) {
            event = event.originalEvent || {};

            if (_.isEmpty(event.data)) {
                return;
            }

            let message;

            try{
                message = JSON.parse(event.data);
            }catch(err){
                return;
            }

            if(message.action !== "save"){
                return;
            }

            $("[name='" + message.name + "']").val(message.content);

            forceCloseRTEModal();
        }
    }

    function closeRTEModal(event){
        event = event.originalEvent || {};

        if (_.isEmpty(event.data) || _.isEmpty($rteModal)) {
            return;
        }

        var message;

        try { message = JSON.parse(event.data); }catch(e){ return; }

        if (!message || message.action !== "cancel") {
            return;
        }

        forceCloseRTEModal();
    }

    function forceCloseRTEModal(){
        var modal = $rteModal.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function openRTEModal(name, rteContent) {
        let $iframe = $('<iframe>'),
            $modal = $('<div>').addClass('eaem-metadata-rte-modal coral-Modal');

        let src =  META_RTE_URL + "?name=" + encodeURIComponent(name) + "&content=" + encodeURIComponent(rteContent);

        $iframe.attr('src', src).appendTo($modal);

        $modal.appendTo('body').modal({
            type: 'default',
            buttons: [],
            visible: true
        });

        $rteModal = $modal;
    }

    function sendCancelMessage(){
        var message = {
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function queryParameters() {
        let result = {}, param,
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

    function isMetadataEditPage() {
        return (window.location.pathname.indexOf(METADATA_EDITOR_PAGE) >= 0);
    }
}(jQuery, jQuery(document)));