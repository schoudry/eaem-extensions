(function($document, $) {
    "use strict";

    $document.on("foundation-contentloaded", initRTE);

    function initRTE(){
        var $rteContainer = $document.find(".richtext-container");

        if(_.isEmpty($rteContainer)){
            return;
        }

        CUI.util.plugClass(CUI.RichText, "richEdit", function(rte) {
            CUI.rte.ConfigUtils.loadConfigAndStartEditing(rte, $(this));
        });

        handleStartFinish($rteContainer);

        styleUI($rteContainer);
    }

    function handleStartFinish($rteContainer){
        $rteContainer.find(".coral-RichText").each(function() {
            ($(this)).richEdit();
        });

        var $valueField = $rteContainer.find("input[type=hidden]");

        $rteContainer.each(function() {
            $(this).find(".coral-RichText-editable").empty().append($valueField.val());
        });

        $rteContainer.on("editing-finished", ".coral-RichText-editable", function(e, editedContent) {
            $valueField.val(editedContent);
        });
    }

    function styleUI($rteContainer){
        var $richTextDiv = $rteContainer.find(".coral-RichText");

        $rteContainer.find("[name='./textIsRich']").remove();

        $richTextDiv.css("height", "180px").closest(".aem-assets-metadata-form-column").css("width", "80%");
    }
})(Granite.$(document), Granite.$);
