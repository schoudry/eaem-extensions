(function ($, $document) {
    var EDITOR_LOADED_EVENT = "cq-editor-loaded",
        allowedGroup = "administrators",
        extended = false;

    $document.on(EDITOR_LOADED_EVENT, extendMSMOpenDialog);

    function extendMSMOpenDialog(){
        if(!Granite.author || !Granite.author.MsmAuthoringHelper){
            console.log("Experience AEM - Granite.author.MsmAuthoringHelper not available");
            return;
        }

        var _origFn = Granite.author.MsmAuthoringHelper.openRolloutDialog;

        Granite.author.MsmAuthoringHelper.openRolloutDialog = function(dialogSource){
            var userGroups = getUserGroups();

            if(!userGroups.includes(allowedGroup)){
                showAlert("Rollout not allowed...", "Rollout");
                return;
            }

            _origFn.call(this, dialogSource);
        };

        handleEditableClick();
    }

    function handleEditableClick(){
        $document.on("cq-overlay-click", function(){
            if(extended){
                return;
            }

            extended = true;

            var _orignRolloutFn = MSM.Rollout.doRollout;

            MSM.Rollout.doRollout = function(commandPath, blueprint, $targets, isBackgroundRollout) {
                var userGroups = getUserGroups();

                if(!userGroups.includes(allowedGroup)){
                    showAlert("Rollout not allowed...", "Rollout");
                    return;
                }

                _orignRolloutFn.call(this, commandPath, blueprint, $targets, isBackgroundRollout);
            }
        });
    }

    function getUserGroups(){
        var userID = Granite.author.ContentFrame.getUserID(), userGroups;

        $.ajax( {
            url: "/bin/security/authorizables.json?filter=" + userID,
            async: false
        } ).done(handler);

        function handler(data){
            if(!data || !data.authorizables){
                return;
            }

            _.each(data.authorizables, function(authObj){
                if( (authObj.id !== userID) || _.isEmpty(authObj.memberOf)){
                    return;
                }

                userGroups = _.pluck(authObj.memberOf, "id");
            });
        }

        return userGroups;
    }

    function showAlert(message, title, callback){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                id: "ok",
                text: "OK",
                primary: true
            }];

        message = message || "Unknown Error";
        title = title || "Error";

        fui.prompt(title, message, "default", options, callback);
    }
}(jQuery, jQuery(document)));