(function ($, $document) {
    var pluginAdded = false,
        PARAFORMAT_PLUGIN = "paraformat",
        TB_TYPE_FULL_SCREEN = "multieditorFullscreen",
        BQ_FORMAT = { description: "Block Quote", "tag": "blockquote"},
        BQ_ACTION = "paraformat#blockquote";

    $document.on("foundation-contentloaded", onContentLoad);

    function onContentLoad(){
        if (pluginAdded) {
            return;
        }

        pluginAdded = true;

        var editorManager = $(".content-fragment-editor").data("multiEditorManager"),
            $fullScreenBtn = editorManager.$_root.find("[data-action='cfm-fullscreen#start']");

        $fullScreenBtn.on("click", addBlockQuotePlugin);
    }

    function addBlockQuotePlugin() {
        var editorManager = $(".content-fragment-editor").data("multiEditorManager"),
            editor = editorManager._editorContainers[0].editor,
            $tbContainer = editor._activeEditor.options.$rteToolbarContainer,
            $popover = CUI.rte.UIUtils.getPopover(PARAFORMAT_PLUGIN, TB_TYPE_FULL_SCREEN, $tbContainer);

        if(!_.isEmpty($popover.find("[data-action='" + BQ_ACTION + "']"))){
            return;
        }

        $popover.find("coral-buttonlist").append(getBlockQuoteHtml($popover));

        var $bqAction = $popover.find("[data-action='" + BQ_ACTION + "']"),
            ek = editor._activeEditor.rte.editorKernel,
            plugin = ek.getPlugin("paraformat");

        plugin.formatUI.formats.push(BQ_FORMAT);

        plugin.formatUI.$ui = $popover.find('button[data-action^="' + PARAFORMAT_PLUGIN + '#"]');

        $bqAction.on('click.rte-handler', handler);

        function handler(e) {
            var pluginUI = plugin.formatUI,
                $target = $(e.target);

            if (!$target.is('button')) {
                $target = $target.closest('button');
            }

            pluginUI._resetSelection();
            pluginUI._select(pluginUI._getFormatId($target));

            var editContext = ek.getEditContext();
            editContext.setState('CUI.SelectionLock', 1);

            plugin.execute();

            ek.enableFocusHandling();
            ek.focus(editContext);
        }
    }

    function getBlockQuoteHtml($paraformat) {
        var $bqButton = $($paraformat.find("button:last")[0].outerHTML);

        $bqButton.attr("data-action", BQ_ACTION).find("coral-list-item-content").html(BQ_FORMAT.description);

        return $bqButton[0].outerHTML;
    }
}(jQuery, jQuery(document)));