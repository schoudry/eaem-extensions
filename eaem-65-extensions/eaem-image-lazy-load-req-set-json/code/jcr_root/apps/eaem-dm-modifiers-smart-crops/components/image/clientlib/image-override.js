(function() {
    "use strict";

    if(!isPublishedMode()){
        return;
    }

    const DM_IMAGE = "image";
    const EAEM_DM_IMAGE = "eaem-image";
    const EAEM_BOUNDING_DIV_CSS = "eaem-bounding-div";

    function init(){
        const elements = document.querySelectorAll('[data-cmp-is="image"]');

        elements.forEach((element) => {
            element.attributes.getNamedItem("data-cmp-is").value = EAEM_DM_IMAGE;
            if(isImageInViewport(element)){
                showImage(element);
            }else{
                addListenerForImageVisibilityCheck(element);
            }
        });
    }

    function addListenerForImageVisibilityCheck(element){
        function scrollListen(){
            if(!isImageInViewport(element)){
                return;
            }

            showImage(element);

            document.removeEventListener("scroll", scrollListen);
        }

        document.addEventListener('scroll', scrollListen);
    }

    function showImage(imageDiv){
        if(imageDiv.parentNode.classList.contains(EAEM_BOUNDING_DIV_CSS)){
            console.log("Exists...");
            return;
        }

        imageDiv.attributes.getNamedItem("data-cmp-is").value = DM_IMAGE;

        //add a parent wrapper to image div, so the mutation observer in core image component (...v2/image/clientlibs/site/js/image.js)
        //picks it up, loads the image and makes a call to the respective smart crop "req=set,json"
        let eaemDivWrapper = document.createElement('div');
        eaemDivWrapper.classList.add(EAEM_BOUNDING_DIV_CSS);

        imageDiv.parentNode.appendChild(eaemDivWrapper);
        eaemDivWrapper.appendChild(imageDiv);
    }

    function isImageInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    function isPublishedMode(){
        return (typeof Granite === 'undefined');
    }

    init();
})();