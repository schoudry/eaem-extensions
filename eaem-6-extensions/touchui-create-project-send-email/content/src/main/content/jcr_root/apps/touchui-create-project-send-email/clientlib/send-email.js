(function(window, $) {
    var MODAL = "modal",
        OPEN_PROJECT_TEXT = "Open project",
        EMAIL_SERVLET = "/bin/experience-aem/send-project-create-email?projectPath=";

    var modalPlugin = $.fn[MODAL],
        ui = $(window).adaptTo("foundation-ui");

    function emailTeam(path){
        if(path.indexOf("/content") < 0){
            return;
        }

        var projectPath = path.substring(path.indexOf("/content"));

        $.ajax( EMAIL_SERVLET + projectPath).done(handler);

        function handler(data){
            if(data.success){
                document.location = path;
                return;
            }

            ui.alert("Error", "Error emailing team", "error");
        }
    }

    //there could be many ways to intercept project creation ajax, i just thought the following is cleaner
    function modalOverride(optionsIn){
        modalPlugin.call(this, optionsIn);

        var $element = $(this);

        if($element.length == 0){
            return;
        }

        var $openProject = $element.find(".coral-Button--primary");

        if($openProject.html() != OPEN_PROJECT_TEXT){
            return;
        }

        var path = $openProject.attr("href");

        $openProject.attr("href", "").html("Email Team").click( function(){
            emailTeam(path);
        } ) ;
    }

    $.fn[MODAL] = modalOverride;
})(window, Granite.$);