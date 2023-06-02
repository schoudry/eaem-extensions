(function ($) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            MASTER = "master",
            CFM_EDITOR_SEL = ".content-fragment-editor",
            CMF_SELECTOR = "[data-granite-coral-multifield-name$='CMF']",
            CMF_TEMPLATE = "Template",
            KV_MF_SELECTOR = "[data-granite-coral-multifield-name$='keyValues']";
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

            Dam.CFM.editor.UI.addBeforeApplyHandler( () => {
                Dam.CFM.EditSession.notifyActiveSession();
                Dam.CFM.EditSession.setDirty(true);
            });
        });
    }

    function hideTabHeaders(){
        $("coral-tablist").last().hide();
    }

    function addKeyValueMultiFieldListener(){
        const $kvMulti = $(KV_MF_SELECTOR);

        createMultiFieldTemplates();

        Coral.commons.ready($kvMulti[0], splitKeyValueJSONIntoFields);
    }

    function splitKeyValueJSONIntoFields(kvMFField){
        const $kvMFField = $(kvMFField),
              kvMFName = $kvMFField.attr("data-granite-coral-multifield-name");

        _.each(kvMFField.items.getAll(), function(item) {
            const $content = $(item).find("coral-multifield-item-content");
            let jsonData = $content.find("[name=" + kvMFName + "]").val();

            if(!jsonData){
                return;
            }

            jsonData = JSON.parse(jsonData);

            $content.html(getParkedMFHtml());

            fillMultiFieldItem(item, jsonData);
        });
    }

    function fillMultiFieldItem(mfItem, jsonData){
        _.each(jsonData, function(fValue, fKey){
            const field = mfItem.querySelector("[name='" + fKey + "']");

            if(field == null){
                return;
            }

            if(field.tagName === 'CORAL-DATEPICKER'){
                field.valueAsDate = new Date(fValue);
            }else{
                field.value = fValue;
            }
        });
    }

    function createMultiFieldTemplates(){
        const $cmfMultis = $(CMF_SELECTOR);

        _.each($cmfMultis, (cmfMulti) => {
            let $cmfMulti = $(cmfMulti);

            $cmfMulti.find("template").remove();

            let template = '<template coral-multifield-template=""><div>' + getParkedMFHtml($cmfMulti) + '</div></template>';

            $cmfMulti.append(template);
        })
    }

    function getParkedMFHtml($cmfMulti){
        let cmfMultiName = $cmfMulti.attr("data-granite-coral-multifield-name"),
            cmfMultiTemplateName =  cmfMultiName + CMF_TEMPLATE,
            $tabView = $cmfMulti.closest("coral-tabview"),
            $tabLabels = $tabView.find('coral-tab-label'),
            templateIndex;

        _.each($tabLabels, (tabLabel, index) => {
            if($(tabLabel).html().trim() == cmfMultiTemplateName){
                templateIndex = index;
            }
        })

        return $($tabView.find("coral-panel").get(templateIndex)).find("coral-panel-content").html();
    }

    function getKeyValueData(){
        const $kvMulti = $(KV_MF_SELECTOR),
                kvMFName = $kvMulti.attr("data-granite-coral-multifield-name");
        let kevValueData = [];

        _.each($kvMulti[0].items.getAll(), function(item) {
            const $fields = $(item.content).find("[name]"),
                data = {};

            _.each($fields, function(field){
                if(canBeSkipped(field)){
                    return;
                }

                data[field.getAttribute("name")] =  field.value;
            });

            kevValueData.push(JSON.stringify(data));
        });

        return { [ kvMFName]  : kevValueData} ;
    }

    function canBeSkipped(field){
        return (($(field).attr("type") == "hidden") || $(field).closest(CFFW).is(":hidden") ||!field.value);
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