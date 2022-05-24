(function ($) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            KV_MF_SELECTOR = "[data-granite-coral-multifield-name='keyValues']",
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

        window.Dam.CFM.Core.registerReadyHandler(() => {
            hideTabHeaders();

            addKeyValueMultiFieldListener();

            addFieldGrouping();
        });
    }

    function hideTabHeaders(){
        $("coral-tablist").hide();
    }

    function addKeyValueMultiFieldListener(){
        const $kvMulti = $(KV_MF_SELECTOR);

        $kvMulti.find("template").remove();

        $kvMulti.append(getKeyValueTemplateFromLastParkedTab());

        $kvMulti.on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, addFieldGrouping);
        });
    }

    function getKeyValueTemplateFromLastParkedTab(){
        const $parkedMFTab = $("coral-panel").last();

        let template = '<template coral-multifield-template=""><div>'
                            + $parkedMFTab.html() || $parkedMFTab.find("coral-panel-content").html()
                        + '</div></template>'

        return template;
    }

    function addFieldGrouping(mfItem){
        Coral.commons.ready($(mfItem).find(FIELD_TYPE_SELECTOR)[0], doVisibility);
    }

    function doVisibility(fieldTypeSelect){
        const widgetItems = fieldTypeSelect.items.getAll();

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