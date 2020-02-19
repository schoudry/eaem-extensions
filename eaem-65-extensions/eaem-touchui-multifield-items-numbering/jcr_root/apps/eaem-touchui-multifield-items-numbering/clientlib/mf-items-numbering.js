(function ($, $document) {
    var COMPOSITE_MULTIFIELD_SELECTOR = "coral-multifield[data-granite-coral-multifield-composite]";

    $document.on("foundation-contentloaded", addNumbering);

    function addNumbering(){
        _.each( [COMPOSITE_MULTIFIELD_SELECTOR], function(mfSel){
            var $mField = $(mfSel);

            $mField.on("coral-collection:add coral-collection:remove", function(event){
                var $mField = $(this);

                Coral.commons.ready(event.detail.item, function(){
                    numberMFItem($mField);
                });
            });

            numberMFItem($mField);
        });

        function numberMFItem($mField){
            var $mfContentItems = $mField.find("coral-multifield-item-content");

            _.each($mfContentItems, function(mfContentItem, index){
                var $mfContentItem = $(mfContentItem);

                if(_.isEmpty($mfContentItem.find(".eaem-mf-counter"))){
                    $mfContentItem.wrapInner('<div style="display:inline-block; margin-left: 5px; width: 96%">');
                }else{
                    $mfContentItem.find(".eaem-mf-counter").remove();
                }

                $mfContentItem.prepend(getIndexHtml(index + 1));
            });
        }

        function getIndexHtml(index){
            return '<div class="eaem-mf-counter" style="display:inline-block; width: 2%; vertical-align: top; ">' +
                '<label class="coral-Form-fieldlabel">'
                + index +
                '.</label>' +
                '</div>'
        }
    }
}(jQuery, jQuery(document), Granite.author));