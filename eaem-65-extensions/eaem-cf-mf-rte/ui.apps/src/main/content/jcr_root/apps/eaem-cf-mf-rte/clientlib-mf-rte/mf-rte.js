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
            KV_MF_SELECTOR = "[data-granite-coral-multifield-name='keyValues']",
            RTE_SELECTOR = ".cfm-multieditor",
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

            extendMultiEditorSupport();
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

                indexRTEsInMF(fieldTypeSelect.closest("coral-multifield-item"));

                doVisibility(fieldTypeSelect, jsonData);
            });

            fillMultiFieldItem(item, jsonData);
        });

        addCollapsers();
    }

    function indexRTEsInMF(mfItem){
        const $rte = $(mfItem).find(RTE_SELECTOR);

        if(_.isEmpty($rte)){
            return;
        }

        $rte.addClass("eaem-mf-rte");
    }

    function fillMultiFieldItem(mfItem, jsonData){
        _.each(jsonData, function(fValue, fKey){
            const field = mfItem.querySelector("[name='" + fKey + "']");

            if(field == null){
                return;
            }

            field.value = fValue;
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
        return (($(field).attr("type") == "hidden") || !field.value);
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
            let summary = $mfItem.find(SUMMARY_FIELD).val();

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

    function extendMultiEditorSupport() {
        const CFM = window.Dam.CFM,
            origGetEditorFn = CFM.MultiEditorManager.prototype.getEditor;

        CFM.MultiEditorManager.prototype.getEditor = getEditor;

        function getEditor($container) {
            const editor = origGetEditorFn.call(this, $container);

            if(editor){
                return;
            }

            _.each(this._editorContainers, (containerObj) => {
                const eContainer = containerObj.container;
                console.log(eContainer);
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