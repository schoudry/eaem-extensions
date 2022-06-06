(function ($, $document) {
    const RTE_CONTAINER_CLASS = ".richtext-container",
            RTE_VALUE_SEL = "[name='./text']";

    $document.one("foundation-contentloaded", initRTE);

    function initRTE(){
        const queryParams = queryParameters();

        $(RTE_CONTAINER_CLASS).css("width", "95%").css("padding-left", "20px");

        let INIT_INTERVAL = setInterval(() =>{
            const rteInstance = $(".cq-RichText-editable").data("rteinstance");

            if(rteInstance && rteInstance.editorKernel){
                rteInstance.setContent(decodeURIComponent(queryParams.value));
                clearInterval(INIT_INTERVAL);
            }
        }, 500);

        setInterval( () => {
            const rteInstance = $(".cq-RichText-editable").data("rteinstance");

            let message = {
                rteName: queryParams.rteName,
                content: rteInstance ? rteInstance.getContent() : $(RTE_VALUE_SEL).val()
            };

            getParent().postMessage(JSON.stringify(message), "*");
        }, 1000);
    }

    function sendDataToMF(queryParams){
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function queryParameters() {
        let result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }
}(jQuery, jQuery(document)));