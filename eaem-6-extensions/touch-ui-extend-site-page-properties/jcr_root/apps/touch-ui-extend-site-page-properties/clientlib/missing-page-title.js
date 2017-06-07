(function($document, $) {
    "use strict";

    //form id defined in /libs/wcm/core/content/sites/properties/jcr:content/body/content/content
    var PROPERTIES_FORM = "propertiesform";

    $document.on("foundation-contentloaded", function(){
        $(".foundation-content-current").on('click', "button[type='submit'][form='" + PROPERTIES_FORM + "']", function(e){
            var $propertiesForm = $("#" + PROPERTIES_FORM);

            if($propertiesForm.length == 0){
                return;
            }

            e.preventDefault();
            e.stopPropagation();

            var title = $propertiesForm.find("[name='./pageTitle']").val(),
                message, warning = false;

            var fui = $(window).adaptTo("foundation-ui");

            if(!title){
                message = "Page title is empty. Are you sure?";
                warning = true;
            }else{
                message = "Page title is '" + title + "'. Submit?";
            }

            fui.prompt("Confirm", message, "notice",
                [{
                    id: "CANCEL",
                    text: "CANCEL",
                    className: "coral-Button"
                },{
                    id: "SUBMIT",
                    text: "SUBMIT",
                    warning: warning,
                    primary: !warning
                }
                ],function (actionId) {
                    if (actionId === "SUBMIT") {
                        $propertiesForm.submit();
                    }
                }
            );
        });
    });
})($(document), Granite.$);