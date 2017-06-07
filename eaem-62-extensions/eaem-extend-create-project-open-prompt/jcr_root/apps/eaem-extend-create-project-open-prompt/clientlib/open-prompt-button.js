(function ($, $document) {
    var OPEN_PROMPT = "projects.openprompt",
        SUCCESS_RESPONSE = "foundation.form.response.ui.success",
        CREATE_PROJECT_URL = "/mnt/overlay/cq/core/content/projects/wizard/newproject.html";

    if(!shouldExecuteForPage()){
        return;
    }

    extendOpenPromptHandler();

    function extendOpenPromptHandler(){
        var openPromptHandler = findOpenPromptHandler();

        if(!openPromptHandler){
            return;
        }

        openPromptHandler.handler = getExtendedHandler(openPromptHandler.handler);
    }

    function getExtendedHandler(origHandler){
        return function(form, config, data, textStatus, xhr){
            origHandler.call(this, form, config, data, textStatus, xhr);

            getUIWidget(".coral-Dialog--success").done(function($dialog){
                $dialog.find("coral-dialog-footer")
                        .find(".coral-Button:first")
                        .children("coral-button-label").html("Back To Projects");
            });
        }
    }

    function findOpenPromptHandler(){
        var registry = $(window).adaptTo("foundation-registry"),
            handlers = registry.get(SUCCESS_RESPONSE),
            handler;

        _.each(handlers, function(handlerObj){
            if(handlerObj.name !== OPEN_PROMPT){
                return;
            }

            handler = handlerObj;
        });

        return handler;
    }

    function getUIWidget(selector){
        if(_.isEmpty(selector)){
            return;
        }

        var deferred = $.Deferred();

        var INTERVAL = setInterval(function(){
            var $widget = $(selector);

            if(_.isEmpty($widget)){
                return;
            }

            clearInterval(INTERVAL);

            deferred.resolve($widget);
        }, 250);

        return deferred.promise();
    }

    function shouldExecuteForPage() {
        return (window.location.pathname.indexOf(CREATE_PROJECT_URL) === 0);
    }
})(jQuery, jQuery(document));