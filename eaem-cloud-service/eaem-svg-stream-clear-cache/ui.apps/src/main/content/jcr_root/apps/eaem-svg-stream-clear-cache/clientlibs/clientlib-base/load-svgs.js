(function(){
    const SVG_URL = "/bin/eaem/svgs",
    SVG_HOLDER_CLASS = "sprite-holder";

    init();

    function init(){
        loadSVGStream();
    }

    function createSvgSpriteDiv(content){
        let elemDiv = document.createElement('div');
        elemDiv.className = SVG_HOLDER_CLASS;
        elemDiv.style.display = "none";
        elemDiv.innerHTML = content;

        document.body.appendChild(elemDiv);
    }

    function loadSVGStream(){
        var request = new XMLHttpRequest();

        request.open("GET", SVG_URL, true);

        request.onload = () => {
            if (request.status != 200) {
                return;
            }

            createSvgSpriteDiv(request.responseText);
        }

        request.send();
    }
}())