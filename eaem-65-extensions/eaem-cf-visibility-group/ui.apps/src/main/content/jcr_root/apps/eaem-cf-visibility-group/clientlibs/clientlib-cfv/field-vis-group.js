(function ($, $document) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            BORDER_STYLE = "1px solid #AAA",
            FIELD_TYPE_SELECTOR = "coral-select[name$='FieldType']";
    let initialized = false;

    if( !isCFEditor() ){
        return;
    }

    init();

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        window.Dam.CFM.Core.registerReadyHandler(addFieldGrouping);
    }

    function addFieldGrouping(){
        $(FIELD_TYPE_SELECTOR).each(function(index, fieldTypeSelect){
            Coral.commons.ready(fieldTypeSelect, (fieldTypeSelect) => {
                doGrouping(fieldTypeSelect);
                doVisibility(fieldTypeSelect);
            });
        });

        function doGrouping(fieldTypeSelect){
            $(fieldTypeSelect).closest(CFFW).css("border-top", BORDER_STYLE)
                                .css("margin-top", "15px");

            const lastItem = fieldTypeSelect.items.getAll().at(-1),
                    $widget = $("[name^='" + lastItem.value + "_']");

            $widget.closest(CFFW).css("border-bottom", BORDER_STYLE)
                                .css("margin-bottom", "10px").css("padding-bottom", "10px");
        }

        function doVisibility(fieldTypeSelect){

        }
    }

    function isCFEditor(){
        return ((URL.indexOf("/editor.html") == 0)
            ||  (URL.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery, jQuery(document)));