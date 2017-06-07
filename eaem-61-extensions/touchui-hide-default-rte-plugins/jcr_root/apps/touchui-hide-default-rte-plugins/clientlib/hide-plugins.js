(function(){
    var INLINE_TOOLBAR = [ "fullscreen#start", "control#close", "control#save"],
        FULLSCREEN_TOOLBAR = [ "fullscreen#finish"];

    var EAEMCuiToolbarBuilder = new Class({
        toString: "EAEMCuiToolbarBuilder",

        extend: CUI.rte.ui.cui.CuiToolbarBuilder,

        _getUISettings: function(options) {
            var uiSettings = this.superClass._getUISettings(options);

            //inline toolbar - "#format", "#justify", "#lists", "links#modifylink",
            // "links#unlink", "fullscreen#start", "control#close", "control#save"
            uiSettings["inline"]["toolbar"] = INLINE_TOOLBAR.slice(0);

            //fullscreen toolbar - "format#bold", "format#italic", "format#underline",
            // "fullscreen#finish"....
            uiSettings["fullscreen"]["toolbar"] = FULLSCREEN_TOOLBAR.slice(0);

            return uiSettings;
        }
    });

    var EAEMToolkitImpl = new Class({
        toString: "EAEMToolkitImpl",

        extend: CUI.rte.ui.cui.ToolkitImpl,

        createToolbarBuilder: function() {
            return new EAEMCuiToolbarBuilder();
        }
    });

    CUI.rte.ui.ToolkitRegistry.register("cui", EAEMToolkitImpl);
}());