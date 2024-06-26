(function(document) {
    const LOGIN_PAGE = "/libs/granite/core/content/login.html",
            BG_DEFAULT_SEL = "#bg_default",
            LOGIN_BOX_SEL = "#login-box";

    document.addEventListener("DOMContentLoaded", changeHelpText);

    function changeHelpText(event){
        if(!isLoginPage()){
            return;
        }

        let loginBoxH1 = document.querySelector(LOGIN_BOX_SEL + " h1");

        loginBoxH1.innerText = "Experiencing Adobe Experience Manager";
        loginBoxH1.style.backgroundColor = "#111111cc";
        loginBoxH1.style.padding = "5px";

        let loginBoxP = document.querySelector(LOGIN_BOX_SEL + " p");
        loginBoxP.innerText = "Aodbe IMS users please use 'Sign in with Adobe'";
        loginBoxP.style.backgroundColor = "#111111cc";
        loginBoxP.style.padding = "5px";

        let loginBG = document.querySelector(BG_DEFAULT_SEL);
        loginBG.style.backgroundImage = "url(/apps/eaem-branding-login/clientlibs/login-branding/resources/team.jpeg)";
        loginBG.style.backgroundSize = "100% 100%";
    }

    function isLoginPage(){
        return (window.location.pathname === LOGIN_PAGE);
    }
}(document));