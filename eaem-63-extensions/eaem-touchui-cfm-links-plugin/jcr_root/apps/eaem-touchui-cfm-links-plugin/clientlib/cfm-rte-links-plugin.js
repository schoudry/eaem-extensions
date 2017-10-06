(function ($, $document) {
    var EAEM_LINK = "eaemLink",
        EAEM_REMOVE_LINK = "eaemRemoveLink",
        PATH_BROWSER_ID = "eaemLinkPathBrowser",
        POPOVER_BUTTONS = "eaemLinkPopoverButtons",
        pluginAdded = false;

    var EAEM_CFM_LINKS_PLUGIN = new Class({
        toString: "EAEMCFMLinksPlugin",

        extend: CUI.rte.plugins.Plugin,

        assetUI: null,

        config: undefined,

        _callback: undefined,

        getFeatures: function () {
            return [ EAEM_LINK, EAEM_REMOVE_LINK ];
        },

        execute: function (pluginCommand, value, envOptions) {
            var context = envOptions.editContext;

            if (pluginCommand !== EAEM_LINK) {
                return;
            }

            openLinksPopover();
        }
    });

    $document.on("cfm:contentchange", addLinksPlugin);

    function closeLinksPopover(){
        var pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $popover[0].open = false;
    }

    function openLinksPopover(){
        var pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $popover[0].open = true;

        setTimeout(applyStyles, 100);

        function applyStyles(){
            var pathBrowserEle = $("#" + PATH_BROWSER_ID),
                $popover = pathBrowserEle.closest("coral-popover");

            $popover.css("left", "0").css("padding", "10px")
                .find("coral-popover-content").children().css("margin-bottom", "10px");

            $(".editor-tools").css("height", "600px");
        }
    }

    function addLinksPlugin(event, data) {
        if (pluginAdded) {
            return;
        }

        var editor = data.editor;

        if (!(editor instanceof Dam.CFM.StyledTextEditor)) {
            return;
        }

        pluginAdded = true;

        var ek = editor.rte.getEditorKernel(),
            $toolbar = $(".editor-tools .toolbar .tools"),
            linkPlugin = getLinkPlugin(ek);

        $toolbar.append(getLinkHtml());

        var linkElement = new CUI.rte.ui.stub.ElementImpl(EAEM_LINK, linkPlugin, true);

        linkElement.notifyToolbar(ek.toolbar);

        createPathBrowser();

        registerListeners(ek);
    }

    function registerListeners(ek){
        var $buttons = $("#" + POPOVER_BUTTONS),
            $cancel = $buttons.children("button:first"),
            $save = $buttons.children("button:last");

        var pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $cancel.click(closeLinksPopover);

        $save.click(handleSave);

        function handleSave(){
            var $popoverContent = $popover.find("coral-popover-content"), cmd = "modifylink",
                objToEdit = {
                    url:  pathBrowserEle.find("input").val(),
                    attributes: {
                        title: $popoverContent.children("input").val()
                    },
                    target: $popoverContent.children("coral-select").val()
                };

            var editContext = ek.getEditContext();

            editContext.setState("CUI.SelectionLock", 1);

            var env = {
                "editContext": editContext
            };

            ek.dialogManager.isShown = function(){};

            var linksPlugin = ek.registeredPlugins["links"];

            linksPlugin.linkDialog = { objToEdit : objToEdit};

            linksPlugin.applyLink(editContext);

            closeLinksPopover();
        }
    }

    function fillPathBrowserInput(event){
        var $pathBrowser = $(event.target), paths = [];

        var selections = $pathBrowser.find(".coral-ColumnView").data("columnView").getSelectedItems();

        if (_.isEmpty(selections)) {
            return;
        }

        $.each(selections, function () {
            paths.push( decodeURIComponent(this.item.data('value')));
        });

        var pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $popover[0].open = true;

        pathBrowserEle.find("input").val(paths[0]);

        openLinksPopover();
    }

    function createPathBrowser(){
        var pathBrowserEle = $("#" + PATH_BROWSER_ID);

        var pathBrowser = new CUI.PathBrowser({
            element: pathBrowserEle,
            pickerTitle: "Select Content",
            crumbRoot: "Content",
            rootPath: "/content",
            pickerAdditionalTabs: undefined,
            pickerSrc: "/libs/wcm/core/content/common/pathbrowser/column.html/content/dam?predicate=hierarchyNotFile"
        });

        pathBrowser.$picker.data("pathbrowser-type", "content-browser");
        pathBrowser.$picker.on("coral-pathbrowser-picker-confirm", fillPathBrowserInput);
    }

    function getOptionHtml(option, value){
        return "<coral-select-item value='" + value + "'>" + option + "</coral-select-item>"
    }

    function getPathBrowserHtml(){
        return  '<div id="' + PATH_BROWSER_ID + '" data-picker-multiselect="false" style="display:inline">' +
                    '<input class="js-coral-pathbrowser-input" is="coral-textfield" placeholder="Path" style="width: 69% ">' +
                    '<button class="js-coral-pathbrowser-button" is="coral-button" title="Select path" style="margin-bottom: 10px; border-radius: 0; border-left:0">' +
                        '<coral-icon icon="select" size="S"/>' +
                    '</button>' +
                '</div>';
    }

    function getTargetHtml(){
        var targetSel = "<coral-select data-type='rel' placeholder='Choose link \"target\" attribute...'>";

        var options = {"_self" : "Same Tab", "_blank" : "New tab", "_parent" : "Parent Frame", "_top" : "Top Frame"};

        _.each(options, function(option, value){
            targetSel = targetSel + getOptionHtml(option, value);
        });

        return (targetSel + "</coral-select>");
    }

    function getButtonHtml(){
        return '<div style="float:right" id="' + POPOVER_BUTTONS + '">' +
                    '<button is="coral-button" title="Close" variant="secondary" style="margin-right: 5px">' +
                        '<coral-icon icon="close" size="S"/>' +
                    '</button>' +
                    '<button is="coral-button" title="Save" variant="primary" >' +
                        '<coral-icon icon="check" size="S"/>' +
                    '</button>' +
                '</div>';
    }

    function getLinkHtml(){
        return '<div class="cfm-toolbar-section">' +
                    '<button id="eaemLink" is="coral-button" variant="quiet" icon="link" iconsize="S" data-rte-command="' +
                        EAEM_LINK + '">' +
                    '</button>' +
                    '<coral-popover placement="bottom" target="#eaemLink">' +
                        '<coral-popover-content>' +
                            getPathBrowserHtml() +
                            '<input class="js-coral-pathbrowser-input" is="coral-textfield" placeholder="Alt text" value="">' +
                            getTargetHtml() + getButtonHtml() +
                        '</coral-popover-content>' +
                    '<coral-popover-header hidden></coral-popover-header>' +
                    '</coral-popover>' +
                    '<button is="coral-button" variant="quiet" icon="linkOff" iconsize="S" data-rte-command="'
                            + EAEM_REMOVE_LINK + '">' +
                    '</button>' +
                '</div>';
    }

    function getLinkPlugin(editorKernel){
        return new EAEM_CFM_LINKS_PLUGIN(editorKernel, EAEM_LINK);
    }
}(jQuery, jQuery(document)));