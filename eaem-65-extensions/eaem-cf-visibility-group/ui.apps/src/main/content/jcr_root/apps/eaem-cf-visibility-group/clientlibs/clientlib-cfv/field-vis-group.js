(function ($) {
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
            Coral.commons.ready(fieldTypeSelect, doVisibility);
        });
    }

    function setFieldStyling(fieldTypeSelect){
        const widgetItems = fieldTypeSelect.items.getAll();

        $(fieldTypeSelect).closest(CFFW).css("border-top", BORDER_STYLE)
                    .css("margin-top", "15px");

        _.each(widgetItems, (item) => {
            const $widget = $("[name^='" + item.value + "_']");

            $widget.closest(CFFW).css("border-bottom", BORDER_STYLE)
                .css("margin-bottom", "10px").css("padding-bottom", "10px");
        })
    }

    function doVisibility(fieldTypeSelect){
        const widgetItems = fieldTypeSelect.items.getAll();

        setFieldStyling(fieldTypeSelect);

        hideAllButThis(fieldTypeSelect.selectedItem.value);

        fieldTypeSelect.on("change", function() {
            hideAllButThis(this.value);
        });

        function hideAllButThis(doNotHide){
            _.each(widgetItems, (item) => {
                const $cffw = $("[name^='" + item.value + "_']").closest(CFFW);
                $cffw.css("display", ( doNotHide == item.value ) ? "block" : "none");
            })
        }
    }

    function isCFEditor(){
        return ((URL.indexOf("/editor.html") == 0)
            ||  (URL.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery));