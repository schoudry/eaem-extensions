(function ($, $document, gAuthor) {
    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', showSlingResourceType);

    function showSlingResourceType(){
        var currentDialog = gAuthor.DialogFrame.currentDialog, dialogPath ;

        if(currentDialog instanceof gAuthor.actions.PagePropertiesDialog){
            var dialogSrc = currentDialog.getConfig().src;
            dialogPath = dialogSrc.substring(0, dialogSrc.indexOf(".html"));
        }else{
            var editable = gAuthor.DialogFrame.currentDialog.editable;

            if(!editable){
                console.log("EAEM - editable not available");
                return;
            }

            dialogPath = editable.config.dialog;
        }

        $.ajax(dialogPath + ".infinity.json").done(handler);

        function handler(data) {
            var resourceTypes = {}, propertyName = "name", message = "";

            fillFieldsResourceType(data, propertyName, resourceTypes);

            _.each(resourceTypes, function(value, key){
                message = message + key + " - " + getStringBeforeLastSlash(value)
                                + "/<b>" + getStringAfterLastSlash(value) + "</b><BR>";
            });

            showMessageBox(message, "Field Resource Types");
        }
    }

    function fillFieldsResourceType(obj, propName, resourceTypes){
        if(!_.isObject(obj) || _.isEmpty(obj) || _.isEmpty(propName)){
            return resourceTypes;
        }

        _.each(obj, function(value, key){
            if(_.isObject(value) && !_.isEmpty(value)){
                resourceTypes = fillFieldsResourceType(value, propName, resourceTypes);
            }else{
                if( key == propName){
                    resourceTypes[value] = obj["sling:resourceType"];
                }
            }
        });

        return resourceTypes;
    }

    function showMessageBox(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "OK",
                primary: true
            }];

        message = message || "Message";
        title = title || "Title";

        fui.prompt(title, message, "notice", options);
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }

    function getStringBeforeLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(0, str.lastIndexOf("/"));
    }
}(jQuery, jQuery(document), Granite.author));