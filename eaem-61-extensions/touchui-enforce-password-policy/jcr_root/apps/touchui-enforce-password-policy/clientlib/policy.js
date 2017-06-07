(function ($, $document) {
    //id added in /libs/granite/security/content/userEditor/items/page/items/contentWrapper/items/contentContainer/items/content/items/content/items/photoSettings/items/col1/items/accountSettings/items/changePassword
    var ADMIN_PASSWORD_DIV = "#admin_password",
        FIELD_CHANGE_PASSWORD = ".change-user-password", // change password form
        FIELD_NEW_USER_PASSWORD = ".user-password-fields", //new user form
        BUTTON_OK = ".user-admin-change-password",  // change password form
        BUTTON_SAVE = ".user-admin-save-user", //new user form
        RE_TYPE_PASSWORD_FIELD = "[name='rep:re-password']";

    var $policyText = $("<div/>").css('padding-bottom', '10px')
                                .css('font-style', 'italic')
                                .css('text-align', 'center')
                                .html('New Password must contain a number');

    $(ADMIN_PASSWORD_DIV).find(".coral-Modal-body")
                        .prepend($policyText);

    $(ADMIN_PASSWORD_DIV).find(RE_TYPE_PASSWORD_FIELD).focusout(focusHandler);

    $(FIELD_NEW_USER_PASSWORD).find(RE_TYPE_PASSWORD_FIELD).focusout(focusHandler);

    //change password form
    $document.on("keyup", FIELD_CHANGE_PASSWORD, function(){
        keyHandler($(FIELD_CHANGE_PASSWORD));
    });

    //new user form
    $document.on("keyup.user-admin change.user-admin selected.user-admin", ".save-button-enabler", function(){
        keyHandler( $(FIELD_NEW_USER_PASSWORD).find("[type=password]"));
    });

    function keyHandler($fields){
        if(!$fields || $fields.length != 2){
            return;
        }

        var one = $($fields[0]).val(), two = $($fields[1]).val();

        if(isValidPassword(one) && isValidPassword(two) && (one == two)){
            return;
        }

        $(BUTTON_OK).attr("disabled", "disabled"); // change password form
        $(BUTTON_SAVE).attr("disabled", "disabled"); //new user form
    }

    function focusHandler(event){
        clearErrors();

        var val = $(event.currentTarget).val();

        if(isValidPassword(val)){
            return;
        }

        var message = "Password must contain a number";

        showErrorAlert(message);
    }

    function clearErrors(){
        $(BUTTON_OK).removeAttr("disabled");   // change password form
        $(BUTTON_SAVE).removeAttr("disabled");  //new user form
    }

    function isValidPassword(text){
        if(!text){
            return true;
        }

        //check for number in text
        return /\d/.test(text);
    }

    function showErrorAlert(message, title){
        var fui = $(window).adaptTo("foundation-ui"),
            options = [{
                text: "OK",
                warning: true
            }];

        title = title || "Error";

        fui.prompt(title, message, "notice", options);

        $(BUTTON_OK).attr("disabled", "disabled"); // change password form
        $(BUTTON_SAVE).attr("disabled", "disabled"); //new user form
    }
})(jQuery, jQuery(document));