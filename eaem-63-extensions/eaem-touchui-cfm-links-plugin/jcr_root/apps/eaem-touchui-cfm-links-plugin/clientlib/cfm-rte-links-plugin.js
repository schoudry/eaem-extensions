(function ($, $document) {
    var EAEM_LINK = "eaemLink",
        EAEM_REMOVE_LINK = "eaemRemoveLink",
        pluginAdded = false,
        url = document.location.pathname;

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

            var pathBrowserEle = $("#eaemLinkPathBrowser");

            var $popover = pathBrowserEle.closest("coral-popover");

            $popover[0].open = true;

            setTimeout(function(){
                $popover.css("left", "0").css("padding", "10px").find("coral-popover-content").children().css("margin-bottom", "10px");
            }, 100);

            pathBrowserEle.find("input:last").click(function(){
                pathBrowserEle.find("input:first").click();
            });
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
            linkPlugin = getLinkPlugin(ek);

        $toolbar.append(getLinkHtml());

        var linkElement = new CUI.rte.ui.stub.ElementImpl(EAEM_LINK, linkPlugin, true);

        linkElement.notifyToolbar(ek.toolbar);

        createPathBrowser();
    }

    function createPathBrowser(){
        var pathBrowserEle = $("#eaemLinkPathBrowser");

        var pathBrowser = new CUI.PathBrowser({
            element: pathBrowserEle,
            pickerTitle: "Select Content",
            crumbRoot: "Content",
            rootPath: "/content",
            pickerAdditionalTabs: undefined,
            pickerSrc: "/libs/wcm/core/content/common/pathbrowser/column.html/content/dam?predicate=hierarchyNotFile"
        });

        pathBrowser.$picker.data("pathbrowser-type", "content-browser");
        pathBrowser.$picker.on("coral-pathbrowser-picker-confirm", function(){});
    }

    function getLinkHtml(){
        return '<div class="cfm-toolbar-section">' +
                    '<button id="eaemLink" is="coral-button" variant="quiet" icon="link" iconsize="S" data-rte-command="' +
                        EAEM_LINK + '">' +
                    '</button>' +
                    '<coral-popover placement="bottom" target="#eaemLink">' +
                        '<coral-popover-content>' +
                            '<div id="eaemLinkPathBrowser" data-picker-multiselect="false" data-resource-path="">' +
                                '<input class="js-coral-pathbrowser-button" value="" type="hidden" >' +
                                '<input class="js-coral-pathbrowser-input" is="coral-textfield" placeholder="Path" value="">' +
                            '</div>' +
                            '<input class="js-coral-pathbrowser-input" is="coral-textfield" placeholder="Alt text" value="">' +
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