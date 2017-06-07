(function($, $document){
    var FOUNDATION_CONTENT_LOADED = "foundation-contentloaded",
        LOGIN_PAGE = "/libs/granite/core/content/login.html";

    addLogo();

    function addLogo(){
        if(isLoginPage()){
            $document.ready(addLoginPageLogo);
        }else{
            addConsoleLogo();
        }
    }

    function addConsoleLogo(){
        $document.on(FOUNDATION_CONTENT_LOADED, function(){
            var html = "<div class='eaem-logo eaem-aem-logo'></div>";
            $(html).prependTo($("coral-shell-header"));
        })
    }

    function addLoginPageLogo(){
        loadCss();

        var html = "<div class='eaem-logo eaem-login-logo'></div>";

        $(html).appendTo($("#backgrounds"));
    }

    function loadCss(){
        $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            href: "/etc/clientlibs/eaem-branding-login/logo/add-logo.css"
        }).appendTo("head");
    }

    function isLoginPage(){
        return (window.location.pathname === LOGIN_PAGE);
    }
}($, $(document)));