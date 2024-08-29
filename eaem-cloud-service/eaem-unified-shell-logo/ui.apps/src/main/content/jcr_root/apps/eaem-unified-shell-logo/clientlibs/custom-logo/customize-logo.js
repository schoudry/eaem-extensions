(function () {
    if (!window.UNIFIED_SHELL || !window.UNIFIED_SHELL.isChildOfUnifiedShell()){
        return;
    }

    const US_CONFIG_URL = "/bin/eaem/usconfig";

    let usHeader = window.parent.document.querySelector("header");

    usHeader.style.display = "none";

    $.ajax(US_CONFIG_URL).done( json => {
        let heroTitle = usHeader.getElementsByClassName("hero-title");

        if(json["title"] && heroTitle && heroTitle.length > 0){
            heroTitle[0].innerHTML = json["title"];
        }

        let heroImage = usHeader.getElementsByClassName("hero-svg");

        if(json["logo"] && heroImage && heroImage.length > 0){
            heroImage[0].src = json["logo"];
        }

        if(json["env"]){
            const INTERVAL = setInterval(function(){
                let envLabel = usHeader.getElementsByClassName("colorBadge");

                if(envLabel && envLabel.length > 0){
                    clearInterval(INTERVAL);
                    envLabel[0].innerHTML = json["env"];
                    usHeader.style.display = "block";
                }
            }, 250);
        }else{
            usHeader.style.display = "block";
        }
    });
}());