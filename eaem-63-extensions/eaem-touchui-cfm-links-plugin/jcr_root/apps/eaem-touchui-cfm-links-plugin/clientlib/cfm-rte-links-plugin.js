(function ($, $document) {
    var EAEM_LINK = "eaemLink",
        EAEM_REMOVE_LINK = "eaemRemoveLink",
        PATH_BROWSER_ID = "eaemLinkPathBrowser",
        POPOVER_BUTTONS = "eaemLinkPopoverButtons",
        pluginAdded = false, bookmark = {};

    var EAEM_CFM_LINKS_PLUGIN = new Class({
        toString: "EAEMCFMLinksPlugin",

        extend: CUI.rte.plugins.Plugin,

        getFeatures: function () {
            return [ EAEM_LINK, EAEM_REMOVE_LINK ];
        },

        execute: function (pluginCommand, value, envOptions) {
            var context = envOptions.editContext;

            if (pluginCommand === EAEM_REMOVE_LINK) {
                this.editorKernel.execCmd("unlink", undefined, context);
            }else{
                bookmark.context = context;
                bookmark.selection = CUI.rte.Selection.createRangeBookmark(context);
                openLinksPopover(context);
            }
        }
    });

    $document.on("cfm:contentchange", addLinksPlugin);

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
            linkPlugin = getLinkPlugin(ek),
            linkRemovePlugin = getLinkRemovePlugin(ek);

        $toolbar.append(getLinkHtml());

        var linkElement = new CUI.rte.ui.stub.ElementImpl(EAEM_LINK, linkPlugin, true);

        linkElement.notifyToolbar(ek.toolbar);

        var linkRemoveElement = new CUI.rte.ui.stub.ElementImpl(EAEM_REMOVE_LINK, linkRemovePlugin, true);

        linkRemoveElement.notifyToolbar(ek.toolbar);

        createPathBrowser();

        registerListeners(ek);
    }

    function getLinkPlugin(editorKernel){
        return new EAEM_CFM_LINKS_PLUGIN(editorKernel, EAEM_LINK);
    }

    function getLinkRemovePlugin(editorKernel){
        return new EAEM_CFM_LINKS_PLUGIN(editorKernel, EAEM_REMOVE_LINK);
    }

    function createPathBrowser(){
        var pathBrowser = new CUI.PathBrowser({
            element: $("#" + PATH_BROWSER_ID),
            pickerTitle: "Select Content",
            crumbRoot: "Content",
            rootPath: "/content",
            pickerSrc: "/libs/wcm/core/content/common/pathbrowser/column.html/content/dam?predicate=hierarchyNotFile"
        });

        pathBrowser.$picker.data("pathbrowser-type", "content-browser");
        pathBrowser.$picker.on("coral-pathbrowser-picker-confirm", fillPathBrowserInput);
    }

    function fillPathBrowserInput(event){
        CUI.rte.Selection.selectRangeBookmark(bookmark.context, bookmark.selection);

        var $pathBrowser = $(event.target), paths = [],
            selections = $pathBrowser.find(".coral-ColumnView").data("columnView").getSelectedItems();

        if (_.isEmpty(selections)) {
            return;
        }

        $.each(selections, function () {
            paths.push( decodeURIComponent(this.item.data('value')));
        });

        $("#" + PATH_BROWSER_ID).find("input").val(paths[0]);

        openLinksPopover();
    }

    function registerListeners(ek){
        var $buttons = $("#" + POPOVER_BUTTONS),
            $cancel = $buttons.children("button:first"),
            $save = $buttons.children("button:last"),
            pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $cancel.click(closeLinksPopover);

        $save.click(handleSave);

        function handleSave(){
            CUI.rte.Selection.selectRangeBookmark(bookmark.context, bookmark.selection);

            var $popoverContent = $popover.find("coral-popover-content"),
                editContext = ek.getEditContext(), linksPlugin = ek.registeredPlugins["links"],
                linkProps = {
                    href:  pathBrowserEle.find("input").val(),
                    attributes: {
                        title: $popoverContent.children("input").val()
                    },
                    target: $popoverContent.children("coral-select").val()
                };

            editContext.setState("CUI.SelectionLock", 1);

            linksPlugin.linkDialog = { objToEdit : linkProps };

            linksPlugin.applyLink(editContext);

            closeLinksPopover();
        }
    }

    function closeLinksPopover(){
        setLinksPopoverVisibility(false);
    }

    function openLinksPopover(){
        setLinksPopoverVisibility(true);

        setTimeout(applyStyles, 100);

        function applyStyles(){
            var pathBrowserEle = $("#" + PATH_BROWSER_ID),
                $popover = pathBrowserEle.closest("coral-popover");

            $popover.css("left", "0").css("padding", "10px")
                    .find("coral-popover-content").children()
                    .css("margin-bottom", "10px");

            $(".editor-tools").css("height", "600px");
        }
    }

    function setLinksPopoverVisibility(open){
        var pathBrowserEle = $("#" + PATH_BROWSER_ID),
            $popover = pathBrowserEle.closest("coral-popover");

        $popover[0].open = open;
    }

    function getOptionHtml(option, value){
        return "<coral-select-item value='" + value + "'>" + option + "</coral-select-item>";
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
        var targetSel = "<coral-select data-type='rel' placeholder='Choose link \"target\" attribute...'>",
            options = {"_self" : "Same Tab", "_blank" : "New tab", "_parent" : "Parent Frame", "_top" : "Top Frame"};

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
                    '<button id="eaemLink" is="coral-button" variant="quiet" icon="link" title="Add Link" iconsize="S" data-rte-command="' +
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
                    '<button is="coral-button" variant="quiet" icon="linkOff" iconsize="S" title="Remove Link" data-rte-command="'
                            + EAEM_REMOVE_LINK + '">' +
                    '</button>' +
                '</div>';
    }
}(jQuery, jQuery(document)));