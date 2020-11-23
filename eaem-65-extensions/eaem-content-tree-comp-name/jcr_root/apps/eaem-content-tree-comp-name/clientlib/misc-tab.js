(function($, $document){
    var CORAL_DIALOG_SEL = "coral-dialog.is-open",
        EAEM_ADDN_INFO_TAB = "dialog-eaem-addn-info",
        ADDN_INFO_DIALOG_URL = "/apps/eaem-content-tree-comp-name/ui/addInfo.html",
        ADDN_INFO_HTML, AUTHORING_NAME_FIELD = "authoringName";

    $document.on("coral-overlay:open", "coral-dialog", addComponentAdditionalInfoTab);

    function loadAddnInfoHtml(){
        $.ajax(ADDN_INFO_DIALOG_URL).done(function(html){
            ADDN_INFO_HTML = html;
        })
    }

    function addComponentAdditionalInfoTab(){
        var $dialog = $(CORAL_DIALOG_SEL);

        if(_.isEmpty($dialog) || !_.isEmpty($("#" + EAEM_ADDN_INFO_TAB)) || !ADDN_INFO_HTML){
            return;
        }

        var $panelTabs = $dialog.find("coral-tabview"),
            tabList = $panelTabs[0].tabList;

        var addInfoTab = tabList.items.add({
            title: "Experience AEM Form",
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
