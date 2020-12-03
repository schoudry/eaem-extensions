(function($, $document){
    var CORAL_DIALOG_SEL = "coral-dialog.is-open",
        EAEM_ADDN_INFO_TAB = "dialog-eaem-addn-info",
        ADDN_INFO_DIALOG_URL = "/apps/eaem-content-tree-comp-name/ui/addInfo.html",
        ADDN_INFO_HTML, AUTHORING_NAME_FIELD = "authoringName",
        authoringNames = {};

    $document.on("coral-overlay:open", "coral-dialog", addComponentAdditionalInfoTab);

    $document.on("cq-editables-updated", $.debounce(500, false, fetchAuthoringNames));

    $document.on("cq-editor-loaded", extendContentTree);

    function fetchAuthoringNames(){
        var contentTree = Granite.author.ui.contentTree;

        if(_.isEmpty(contentTree.editables)){
            return;
        }

        var responsiveGridPath = contentTree.editables[0].path;

        $.ajax( { url: responsiveGridPath + ".infinity.json", async: false } ).done(function(data){
            authoringNames = loadComponentAuthoringNames(responsiveGridPath, data, {});
        });
    }

    function extendContentTree(){
        fetchAuthoringNames();

        var contentTree = Granite.author.ui.contentTree,
            _orignFn = contentTree._getElementTitle;

        contentTree._getElementTitle = function (editable, componentTitle) {
            var titleHtml = _orignFn.call(this, editable, componentTitle),
                authoringTitle = authoringNames[editable.path];

            if(authoringTitle){
                titleHtml = "<span class='editor-ContentTree-itemTitle'>" + authoringTitle + "</span>";
            }

            return titleHtml;
        }
    }

    function loadComponentAuthoringNames(path, data, authoringNames){
        _.each(data, function(value, nodeName){
            if(_.isObject(value)){
                loadComponentAuthoringNames(path + "/" + nodeName, value, authoringNames);
            }

            if( (nodeName === AUTHORING_NAME_FIELD) && value){
                authoringNames[path] = value;
            }
        });

        return authoringNames;
    }

    function loadAddnInfoHtml(){
        $.ajax(ADDN_INFO_DIALOG_URL).done(function(html){
            ADDN_INFO_HTML = html;
        })
    }

    function addComponentAdditionalInfoTab(){
        var $dialog = $(CORAL_DIALOG_SEL);

        if(($dialog.length == 0) || ($("#" + EAEM_ADDN_INFO_TAB).length > 0) || !ADDN_INFO_HTML){
            return;
        }

        var $panelTabs = $dialog.find("coral-tabview");

        if(_.isEmpty($panelTabs)){
            return;
        }

        $panelTabs[0].tabList.items.add({
            label: {
                innerHTML: '<span id="' + EAEM_ADDN_INFO_TAB + '">EAEM Additional Info</span>'
            }
        });

        var panelStack = $panelTabs[0].panelStack;

        panelStack.items.add({
            content: {
                innerHTML: ADDN_INFO_HTML
            }
        });

        loadAddInfoContent($dialog);
    }

    function loadAddInfoContent($dialog){
        var dialogPath;

        try {
            dialogPath = Granite.author.DialogFrame.currentDialog.editable.slingPath;
        } catch (err) {
            console.log("Error getting dialog path...", err);
        }

        if (!dialogPath) {
            return;
        }

        dialogPath = dialogPath.substring(0, dialogPath.lastIndexOf(".json"));

        $.ajax(dialogPath + ".2.json").done(function(data){
            $dialog.find("[name='./" + AUTHORING_NAME_FIELD + "']").val(data[AUTHORING_NAME_FIELD]);
        });
    }

    loadAddnInfoHtml();
}(jQuery, jQuery(document)));

