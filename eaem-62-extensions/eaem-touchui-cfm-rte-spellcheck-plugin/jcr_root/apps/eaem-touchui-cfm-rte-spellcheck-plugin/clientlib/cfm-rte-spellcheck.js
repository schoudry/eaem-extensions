(function ($, $document) {
    var SPELL_CHECK_URL = "/libs/cq/ui/rte/spellcheck",
        SPELL_CHECK_PLUGIN = "spellcheck",
        SPELL_CHECK_CHECK_TEXT = "checktext",
        pluginAdded = false;

    $document.on("cfm:contentchange", addSpellCheckPlugin);

    function addSpellCheckPlugin(event, data) {
        if (pluginAdded) {
            return;
        }

        var editor = data.editor;

        if (!(editor instanceof Dam.CFM.StyledTextEditor)) {
            return;
        }

        pluginAdded = true;

        var ek = editor.rte.getEditorKernel(),
            $toolbar = editor.$toolbar,
            spellCheckPlugin = getMockSpellCheckPlugin(ek);

        $toolbar.append(getSpellCheckHtml());

        var scElem = new CUI.rte.ui.stub.ElementImpl(SPELL_CHECK_CHECK_TEXT, spellCheckPlugin, true);

        scElem.notifyToolbar(ek.toolbar);

        editor.$editor.on("click", function () {
            scElem.plugin.clearInvalidationMarks(ek.editContext);
        });

        scElem.$el.on("click.rte-handler", function () {
            performSpellCheck(ek.getProcessedHtml());
        });
    }

    function getSpellCheckHtml(){
        return '<div>' +
                    '<button is="coral-button" variant="quiet" icon="'
                            + SPELL_CHECK_PLUGIN + '" iconsize="S" data-rte-command="'
                            + SPELL_CHECK_CHECK_TEXT + '">' +
                    '</button>' +
                '</div>';
    }

    function getMockSpellCheckPlugin(editorKernel){
        var spellCheckPlugin = new CUI.rte.plugins.SpellCheckerPlugin(editorKernel, SPELL_CHECK_PLUGIN);

        spellCheckPlugin.config = {
            method: "POST",
            spellcheckerUrl: SPELL_CHECK_URL,
            invalidStyle: "border-bottom: dotted red;"
        };

        spellCheckPlugin.checkTextUI = {
            setHighlighted: function(){}
        };

        return spellCheckPlugin;
    }

    function performSpellCheck(content){
        $.ajax({
            url: SPELL_CHECK_URL,
            data: {
                "_charset_": "utf-8",
                "mode": "text",
                "html": "true",
                "text": content
            }
        }).done(handler);

        function handler(spellCheckResults){
            if(!_.isEmpty(spellCheckResults.words)){
                return;
            }

            showMessageBox("No mistakes found", "Spellcheck");
        }
    }

    function showMessageBox(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "OK",
                primary: true
            }];

        message = message || "Ok";
        title = title || "Ok";

        fui.prompt(title, message, "success", options);
    }
}(jQuery, jQuery(document)));