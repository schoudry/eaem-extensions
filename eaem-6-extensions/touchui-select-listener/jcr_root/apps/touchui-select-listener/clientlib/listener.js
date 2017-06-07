(function ($, $document) {
    "use strict";

    var COUNTRY = "./country", CAPITAL = "./capital";

    function adjustLayoutHeight(){
        //with only two selects, the second select drop down is not visible when expanded, so adjust the layout height
        //fixedcolumns i guess doesn't support css property height, so fallback to jquery
        //http://docs.adobe.com/docs/en/aem/6-0/develop/ref/granite-ui/api/jcr_root/libs/granite/ui/components/foundation/layouts/fixedcolumns/index.html
        $(".coral-FixedColumn-column").css("height", "18rem");
    }

    $document.on("dialog-ready", function() {
        adjustLayoutHeight();

        //get the country widget
        var country = new CUI.Select({
            element: $("[name='" + COUNTRY +"']").closest(".coral-Select")
        });

        //get the capital widget
        var capital = new CUI.Select({
            type: 'disabled',
            element: $("[name='" + CAPITAL +"']").closest(".coral-Select")
        });

        if(_.isEmpty(country) || _.isEmpty(capital)){
            return;
        }

        //workaround to remove the options getting added twice, using CUI.Select()
        country._selectList.children().not("[role='option']").remove();
        capital._selectList.children().not("[role='option']").remove();

        //listener on country select
        country._selectList.on('selected.select', function(event){
            //select country's capital and throw change event for touchui to update ui
            capital._select.val(event.selectedValue).trigger('change');
        });

        //listener on capital select
        capital._selectList.on('selected.select', function(event){
            //select capital's country and throw change event for touchui to update ui
            country._select.val(event.selectedValue).trigger('change');
        });
    });
})($, $(document));