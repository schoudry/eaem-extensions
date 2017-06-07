(function ($, document) {
    "use strict";

    var USER_EDITOR_CONTAINER = ".user-editor-container",
        USER_ADMIN_CLEAR = ".user-admin-clear",
        USER_EDITOR_URL = "/libs/granite/security/content/userEditor.html",
        ADD_DETAILS_CONTENT_URL = "/apps/touchui-usereditor-new-field/content/addn-details";

    getAdditionalFields();

    function getAdditionalFields(){
        $.ajax( { url: ADD_DETAILS_CONTENT_URL + ".html", dataType: 'html'}).done(handler);

        function handler(data){
            if(_.isEmpty(data)){
                return;
            }

            var $fields = ($(data)).children();

            $fields.insertBefore($(USER_EDITOR_CONTAINER).find(USER_ADMIN_CLEAR));

            fillAdditionalFields($fields);
        }
    }

    function fillAdditionalFields($fields){
        if(_.isEmpty($fields)){
            return;
        }

        var url = document.location.pathname;

        url = url.substring(USER_EDITOR_URL.length);

        $.ajax(url + "/profile.json").done(handler);

        function handler(data){
            if(_.isEmpty(data)){
                return;
            }

            var $input, name;

            //handles input types only, add additional logic for other type like checkbox...
            $fields.each(function(i, field){
                $input = $(field).find("input");

                name = $input.attr("name");

                name = getStringAfterLastSlash(name);

                $input.val(data[name]);
            });
        }
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return str;
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
})(jQuery, document);