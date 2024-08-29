(function () {
    if (!window.UNIFIED_SHELL || !window.UNIFIED_SHELL.isChildOfUnifiedShell()){
        return;
    }

    let usHeader = window.parent.document.querySelector("header");

    usHeader.style.display = "none"

    let heroTitle = usHeader.getElementsByClassName("hero-title");

    if(heroTitle && heroTitle.length > 0){
        heroTitle[0].innerHTML = "Experience AEM";
    }

    let heroImage = usHeader.getElementsByClassName("hero-svg");

    if(heroImage && heroImage.length > 0){
        heroImage[0].src = "./logo.png";
    }

    setTimeout(() => {
        usHeader.style.display = "block";
    }, 500)
}());