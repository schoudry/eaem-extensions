(function ($) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            MASTER = "master",
            CFM_EDITOR_SEL = ".content-fragment-editor",
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
            extendRequestSave();

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

        createTemplateFromLastParkedTab();

        $kvMulti.on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, addFieldGrouping);
        });

        Coral.commons.ready($kvMulti[0], splitKeyValueJSONIntoFields);
    }

    function splitKeyValueJSONIntoFields(kvMFField){
        const kvMFName = $(kvMFField).attr("data-granite-coral-multifield-name");

        _.each(kvMFField.items.getAll(), function(item) {
            const $content = $(item).find("coral-multifield-item-content");
            let jsonData = $content.find("[name=" + kvMFName + "]").val();

            if(!jsonData){
                return;
            }

            jsonData = JSON.parse(jsonData);

            $content.html(getParkedMFHtml());

            Coral.commons.ready($content.find(FIELD_TYPE_SELECTOR)[0], (fieldTypeSelect) => {
                fieldTypeSelect.value = jsonData[fieldTypeSelect.name];
                doVisibility(fieldTypeSelect, jsonData);
            });
        });
    }

    function createTemplateFromLastParkedTab(){
        const $kvMulti = $(KV_MF_SELECTOR);

        $kvMulti.find("template").remove();

        let template = '<template coral-multifield-template=""><div>' + getParkedMFHtml() + '</div></template>';

        $kvMulti.append(template);
    }

    function getParkedMFHtml(){
        const $parkedMFTab = $("coral-panel").last();
        return $parkedMFTab.html() || $parkedMFTab.find("coral-panel-content").html();
    }

    function getKeyValueData(){
        const $kvMulti = $(KV_MF_SELECTOR),
                kvMFName = $kvMulti.attr("data-granite-coral-multifield-name");
        let kevValueData = [];

        _.each($kvMulti[0].items.getAll(), function(item) {
            const $content = $(item.content),
                fieldTypeSelect = $content.find(FIELD_TYPE_SELECTOR)[0],
                data = {};

            const selectedWidget = $content.find("[name^='" + fieldTypeSelect.selectedItem.value + "_']")[0];

            data[fieldTypeSelect.name] = fieldTypeSelect.selectedItem.value;
            data[selectedWidget.name] = selectedWidget.value;

            kevValueData.push(JSON.stringify(data));
        });

        return { [ kvMFName]  : kevValueData} ;
    }

    function addFieldGrouping(mfItem){
        Coral.commons.ready($(mfItem).find(FIELD_TYPE_SELECTOR)[0], doVisibility);
    }

    function doVisibility(fieldTypeSelect, jsonData){
        if(!fieldTypeSelect){
            return;
        }

        const widgetItems = fieldTypeSelect.items.getAll();

        hideAllButThis(fieldTypeSelect.selectedItem.value);

        fieldTypeSelect.on("change", function() {
            hideAllButThis(this.value);
        });

        function hideAllButThis(doNotHide){
            _.each(widgetItems, (item) => {
                let $widget = $(fieldTypeSelect).closest("coral-multifield-item").find("[name^='" + item.value + "_']");

                if(jsonData && jsonData[$widget.attr("name")]){
                    $widget.val(jsonData[$widget.attr("name")]);
                }

                const $cffw = $widget.closest(CFFW);
                $cffw.css("display", ( doNotHide == item.value ) ? "block" : "none");
            })
        }
    }

    function extendRequestSave(){
        const CFM = window.Dam.CFM,
            orignFn = CFM.editor.Page.requestSave;

        CFM.editor.Page.requestSave = requestSave;

        function requestSave(callback, options) {
            orignFn.call(this, callback, options);

            const kvData = getKeyValueData();

            if(_.isEmpty(kvData)){
                return;
            }

            const url = CFM.EditSession.fragment.urlBase + ".cfm.content.json",
                variation = getVariation(),
                createNewVersion = (options && !!options.newVersion) || false;

            let data = {
                ":type": "multiple",
                ":newVersion": createNewVersion,
                "_charset_": "utf-8"
            };

            if(variation !== MASTER){
                data[":variation"] = variation;
            }

            const request = {
                url: url,
                method: "post",
                dataType: "json",
                data: _.merge(data, kvData),
                cache: false
            };

            CFM.RequestManager.schedule({
                request: request,
                type: CFM.RequestManager.REQ_BLOCKING,
                condition: CFM.RequestManager.COND_EDITSESSION,
                ui: (options && options.ui)
            })
        }
    }

    function getVariation(){
        var variation = $(CFM_EDITOR_SEL).data('variation');

        variation = variation || "master";

        return variation;
    }

    function isCFEditor(){
        return ((URL.indexOf("/editor.html") == 0)
            ||  (URL.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery));