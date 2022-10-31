(function() {
    "use strict";

    if(isPublishedMode()){
        return;
    }

    const DM_IMAGE = "image";

    function init(){
        const elements = document.querySelectorAll('[data-cmp-is="image"]');

        elements.forEach((element) => {
            alert("hi");
        });
    }

    function isPublishedMode(){
        return (typeof Granite === 'undefined');
    }

    init();
})();