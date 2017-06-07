(function($, $document){
    //dialogs marked with eaem-rte-iframe-content data attribute execute the below logic
    //to send dialog values to parent window RTE
    var EAEM_RTE_IFRAME_CONTENT = "eaem-rte-iframe-content",
        HELP_BUTTON_SEL = ".cq-dialog-help",
        CANCEL_BUTTON_SEL = ".cq-dialog-cancel",
        SUBMIT_BUTTON_SEL = ".cq-dialog-submit",
        ALT_TEXT_NAME = "./alt",
        IMAGE_NAME = "./image";

    $document.on("foundation-contentloaded", stylePopoverIframe);

    function stylePopoverIframe(){
        var $iframeContent = $("[" + 'data-' + EAEM_RTE_IFRAME_CONTENT + "]");

        if(_.isEmpty($iframeContent)){
            return
        }

        var $form = $iframeContent.closest("form"),
            $cancel = $form.find(CANCEL_BUTTON_SEL),
            $submit = $form.find(SUBMIT_BUTTON_SEL);

        $form.css("border", "solid 2px");
        $form.find(HELP_BUTTON_SEL).hide();

        $document.off("click", CANCEL_BUTTON_SEL);
        $document.off("click", SUBMIT_BUTTON_SEL);
        $document.off("submit");

        $cancel.click(sendCloseMessage);
        $submit.click(sendDataMessage);
    }

    function sendCloseMessage(){
        var message = {
            sender: EAEM_RTE_IFRAME_CONTENT,
            action: "close"
        };

        parent.postMessage(JSON.stringify(message), "*");
    }

    function sendDataMessage(){
        var message = {
            sender: EAEM_RTE_IFRAME_CONTENT,
            action: "submit",
            data:{
                altText: $("[name='" + ALT_TEXT_NAME + "']").val(),
                imagePath: $("[name='" + IMAGE_NAME + "']").val()
            }
        };

        parent.postMessage(JSON.stringify(message), "*");
    }
})(jQuery, jQuery(document));