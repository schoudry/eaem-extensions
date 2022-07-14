(function ($) {
    const   URL = document.location.pathname,
            CFFW = ".coral-Form-fieldwrapper",
            MASTER = "master",
            CFM_EDITOR_SEL = ".content-fragment-editor",
            CORAL_MULTIFIELD = "coral-multifield",
            CORAL_MULTIFIELD_ITEM = "coral-multifield-item",
            SUMMARY_FIELD = "[name='key']",
            CORAL_MULTIFIELD_ITEM_CONTENT = "coral-multifield-item-content",
            EAEM_SUMMARY = "eaem-summary",
            FIELD_MULTI_STRING = "FIELD_MULTI_STRING",
            KV_MF_SELECTOR = "[data-granite-coral-multifield-name='keyValues']",
            RTE_PAGE_URL = "/apps/eaem-cf-mf-rte/rte-page.html",
            MF_RTE_NAME = "eaem-mf-rte",
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

            fillMultiFieldItem(item, jsonData);
        });

        addCollapsers();
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
        const $parkedMFTab = $("coral-panel").last();
        return $parkedMFTab.html() || $parkedMFTab.find("coral-panel-content").html();
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

        const rteName = MF_RTE_NAME + "-" + (Math.random() + 1).toString(36).substring(7)

        if($widget.attr(MF_RTE_NAME)){
            return;
        }

        $widget.attr(MF_RTE_NAME, rteName);

        $cffw.append(getRTEBlock(rteName, $widget.val()));
    }

    function addCollapsers(){
        const $kvMulti = $(KV_MF_SELECTOR).css("padding-right", "2.5rem");

        if(_.isEmpty($kvMulti)){
            return;
        }

        $kvMulti.find(CORAL_MULTIFIELD_ITEM).each(handler);

        $kvMulti.on('change', function(){
            $kvMulti.find(CORAL_MULTIFIELD_ITEM).each(handler);
        });

        addExpandCollapseAll($kvMulti);

        function handler(){
            const $mfItem = $(this);

            if(!_.isEmpty($mfItem.find("[icon=accordionUp]"))){
                return;
            }

            addAccordionIcons($mfItem);

            addSummarySection($mfItem);
        }
    }

    function addAccordionIcons($mfItem){
        const up = new Coral.Button().set({
            variant: "quiet",
            icon: "accordionUp",
            title: "Collapse"
        });

        up.setAttribute('style', 'position:absolute; top: 0; right: -2.175rem');
        up.on('click', handler);

        $mfItem.append(up);

        const down = new Coral.Button().set({
            variant: "quiet",
            icon: "accordionDown",
            title: "Expand"
        });

        down.setAttribute('style', 'position:absolute; top: 0; right: -2.175rem');
        down.on('click', handler).hide();

        $mfItem.append(down);

        function handler(event){
            event.preventDefault();

            const mfName = $(this).closest(CORAL_MULTIFIELD).attr("data-granite-coral-multifield-name"),
                $mfItem = $(this).closest(CORAL_MULTIFIELD_ITEM),
                $summarySection = $mfItem.children("." + EAEM_SUMMARY);

            $summarySection.html(getSummary($mfItem, mfName));

            adjustUI.call(this, $summarySection);
        }

        function adjustUI($summarySection){
            const icon = $(this).find("coral-icon").attr("icon"),
                $content = $mfItem.find(CORAL_MULTIFIELD_ITEM_CONTENT);

            if(icon == "accordionUp"){
                if($summarySection.css("display") !== "none"){
                    return;
                }

                $summarySection.show();

                $content.slideToggle( "fast", function() {
                    $content.hide();
                });

                up.hide();
                down.show();
            }else{
                if($summarySection.css("display") === "none"){
                    return;
                }

                $summarySection.hide();

                $content.slideToggle( "fast", function() {
                    $content.show();
                });

                up.show();
                down.hide();
            }
        }

        function getSummary($mfItem){
            const fieldTypeSelect = $mfItem.find(FIELD_TYPE_SELECTOR);
            let summary = $mfItem.find("[name^='" + fieldTypeSelect[0].value + "_']").val();

            if(!summary){
                summary = "Click to expand";
            }

            return summary;
        }
    }

    function addExpandCollapseAll($kvMulti){
        let $mfAdd, expandAll, collapseAll;

        $kvMulti.find("[coral-multifield-add]").each(handler);

        function handler(){
            $mfAdd = $(this);

            expandAll = new Coral.Button().set({
                variant: 'secondary',
                innerText: "Expand All"
            });

            $(expandAll).css("margin-left", "10px").click((event) => {
                event.preventDefault();
                $(this).closest(CORAL_MULTIFIELD).find("[icon='accordionDown']").click();
            });

            collapseAll = new Coral.Button().set({
                variant: 'secondary',
                innerText: "Collapse All"
            });

            $(collapseAll).css("margin-left", "10px").click((event) => {
                event.preventDefault();
                $(this).closest(CORAL_MULTIFIELD).find("[icon='accordionUp']").click();
            });

            $mfAdd.after(expandAll).after(collapseAll);
        }
    }

    function addSummarySection($mfItem){
        const $summarySection = $("<div/>").insertAfter($mfItem.find(CORAL_MULTIFIELD_ITEM_CONTENT))
                    .addClass("coral-Well " + EAEM_SUMMARY).css("cursor", "pointer").hide();

        $summarySection.click(function(){
            $mfItem.find("[icon='accordionDown']").click();
        });
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