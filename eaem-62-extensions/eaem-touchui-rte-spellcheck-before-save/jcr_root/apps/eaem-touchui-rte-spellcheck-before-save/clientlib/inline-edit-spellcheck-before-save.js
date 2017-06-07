(function ($, $document, gAuthor) {
    if(!gAuthor){
        return;
    }

    var SPELL_CHECK_URL = "/libs/cq/ui/rte/spellcheck",
        currentEditable = null, doSpellCheck = true;

    $document.on("cq-editables-loaded", function(event){
        $.each(event.editables, function(index, editable){
            if(!editable.dom || !isInPlaceEditingEnabled(editable)){
                return;
            }

            editable.dom.on("editing-start", getEditStartedListener(editable));
        });
    });

    $document.on("inline-edit-finish", function (event) {
        event.editable.dom.on("editing-start", getEditStartedListener(event.editable));
    });

    function isInPlaceEditingEnabled(editable){
        try{
            var editConfig = editable.config.editConfig;
            return editConfig && editConfig.inplaceEditingConfig && editConfig.inplaceEditingConfig.active;
        }catch(err){
            return false;
        }
    }

    function getEditStartedListener(editable){
        var gRegistry = Granite.author.editor.registry,
            emptyFn = function(){};

        if(_.isEmpty(gRegistry)){
            console.log("EAEM - Granite author registry not available");
            return emptyFn;
        }

        var inlineTextEditor = gRegistry["text"];

        if(!inlineTextEditor){
            console.log("EAEM - Granite author rte not available");
            return emptyFn;
        }

        return function eaemEditStartedListener(){
            if(!inlineTextEditor.rte){
                return;
            }

            currentEditable = editable;

            doSpellCheck = true;

            var listeners = inlineTextEditor.rte.options.listeners,
                beforeFinishFn = listeners["beforeFinish"],
                onStartedFn = listeners["onStarted"];

            if(!beforeFinishFn){
                listeners["beforeFinish"] = eaemBeforeFinishListener;
            }else{
                listeners["beforeFinish"] = function(){
                    eaemBeforeFinishListener();
                    beforeFinishFn();
                }
            }

            if(!onStartedFn){
                listeners["onStarted"] = eaemEditStartedListener;
            }else{
                listeners["onStarted"] = function(){
                    eaemEditStartedListener();
                    onStartedFn();
                }
            }
        }
    }

    function eaemBeforeFinishListener(){
        return performSpellCheck(this.getContent());
    }

    function performSpellCheck(content){
        if(!doSpellCheck){
            return false;
        }

        var doNotSave = false;

        $.ajax({
            async: false,
            url: SPELL_CHECK_URL,
            data: {
                "_charset_": "utf-8",
                "mode": "text",
                "html": "true",
                "text": content
            }
        }).done(handler);

        function handler(spellCheckResults){
            if(_.isEmpty(spellCheckResults.words)){
                return;
            }

            var spellCheckPlugin = getMockSpellCheckPlugin();
            spellCheckPlugin.checkSuccess(spellCheckResults);

            showMessageBox("Spell check found mistakes...", "Spellcheck");

            doNotSave = true;
        }

        return doNotSave;
    }

    function getMockSpellCheckPlugin(){
        var inlineTextEditor = Granite.author.editor.registry["text"],
            spellCheckPlugin = new CUI.rte.plugins.SpellCheckerPlugin(inlineTextEditor.rte.editorKernel, "spellcheck");

        spellCheckPlugin.config = {
            "invalidStyle": "border-bottom: dotted red;"
        };

        spellCheckPlugin.checkTextUI = {
            setHighlighted: function(){}
        };

        return spellCheckPlugin;
    }

    function showMessageBox(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "RE-EDIT",
                text: "RE-EDIT",
                primary: true
            },{
                id: "SAVE",
                text: "SAVE",
                warning: true
            }];

        message = message || "Message";
        title = title || "Title";

        fui.prompt(title, message, "error", options, handler);

        function handler(btnId){
            var inlineTextEditor = Granite.author.editor.registry["text"];

            doSpellCheck = false;

            if (btnId === "SAVE") {
                inlineTextEditor.rte.editorKernel.execCmd("save");
            }else{
                _.debounce(startInlineEdit, 500)();
            }
        }
    }

    function startInlineEdit(){
        var inlineTextEditor = Granite.author.editor.registry["text"];
        inlineTextEditor.startInlineEdit(currentEditable);
    }
}(jQuery, jQuery(document), Granite.author));