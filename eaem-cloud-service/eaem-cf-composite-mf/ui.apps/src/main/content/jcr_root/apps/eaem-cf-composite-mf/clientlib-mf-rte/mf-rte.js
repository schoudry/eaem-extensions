(function ($) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            MASTER = "master",
            CFM_EDITOR_SEL = ".content-fragment-editor",
            KV_MF_SELECTOR = "[data-granite-coral-multifield-name='keyValues']",
            RTE_PAGE_URL = "/apps/eaem-cf-mf-rte/rte-page.html",
            MF_RTE_NAME = "eaem-mf-rte";
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

            addRTEDataListener();

            Dam.CFM.editor.UI.addBeforeApplyHandler( () => {
                Dam.CFM.EditSession.notifyActiveSession();
                Dam.CFM.EditSession.setDirty(true);
            });
        });
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

            $("[" + MF_RTE_NAME + "=" + message.rteName + "]").val(message.content);
        }
    }

    function hideTabHeaders(){
        $("coral-tablist").last().hide();
    }

    function addKeyValueMultiFieldListener(){
        const $kvMulti = $(KV_MF_SELECTOR);

        createTemplateFromLastParkedTab();

        $kvMulti.on("coral-collection:add", function(event){
            Coral.commons.ready(event.detail.item, function(mfItem){
                const $mfItem = $(mfItem),
                     $cffw = $widget.closest(CFFW);

                //addRTEContainer($cffw);
            });
        });

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

            //addRTEContainer($cffw, $widget);

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

    function createTemplateFromLastParkedTab(){
        const $kvMulti = $(KV_MF_SELECTOR);

        $kvMulti.find("template").remove();

        let template = '<template coral-multifield-template=""><div>' + getParkedMFHtml() + '</div></template>';

        $kvMulti.append(template);
    }

    function getParkedMFHtml(){
        return $("coral-panel").last().find("coral-panel-content").html();
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

    function addRTEContainer($cffw, $widget){
        $widget.hide();

        const rteName = MF_RTE_NAME + "-" + (Math.random() + 1).toString(36).substring(7);

        if($widget.attr(MF_RTE_NAME)){
            return;
        }

        $widget.attr(MF_RTE_NAME, rteName);

        $cffw.append(getRTEBlock(rteName, $widget.val()));
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

    function getRTEBlock(rteName, value){
        const iframeHTML = "<iframe width='1050px' height='150px' frameBorder='0' " +
                                "src='" + RTE_PAGE_URL + "?rteName=" + rteName + "&value=" + encodeURIComponent(value)+ "'>" +
                            "</iframe>";

        return "<div>" + iframeHTML + "</div>";
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