(function() {
    "use strict";

    const CONFIG_NODE_SEL = '[data-config]',
        SRC_URI_TEMPLATE_WIDTH_VAR = "{.width}",
        SMART_CROPS_SET_JSON = "smartCropsSetJson",
        EAEM_DM_IMAGE = "eaem-image";

    if(!isPublishedMode()){
        postSetJsonInAuthoring();
    }

    function postSetJsonInAuthoring(){
        const elements = document.querySelectorAll('[data-cmp-is="image"]');

        elements.forEach((element) => {
            //element.attributes.getNamedItem("data-cmp-is").value = EAEM_DM_IMAGE;
            const data = element.dataset,
                cmpSrc = data.cmpSrc,
                imageUrl = cmpSrc.substring(0, cmpSrc.indexOf(SRC_URI_TEMPLATE_WIDTH_VAR));

            const configNode = $(element).parent().find(CONFIG_NODE_SEL)[0];

            if(!configNode){
                return;
            }

            const cmpCrxPath = configNode.dataset.path,
                url = imageUrl + (imageUrl.indexOf("?") < 0 ? "?" : "") + "req=set,json";

            const setJsonResponseStr = getSmartCropsSetJsonResponse(url);

            postSmartCropsSetJsonResponse(cmpCrxPath, setJsonResponseStr);
        });
    }

    function postSmartCropsSetJsonResponse(cmpCrxPath, setJsonResponseStr){
        let request = new XMLHttpRequest(),
            params = SMART_CROPS_SET_JSON + "=" + setJsonResponseStr;

        request.open("POST", cmpCrxPath, false);
        request.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        request.onload = () => {
            if (request.status != 200) {
                console.log("Error posting smart crop set json");
            }
        }

        request.send(params);
    }

    function getSmartCropsSetJsonResponse(url){
        var request = new XMLHttpRequest(),
            setJsonResponseStr;

        request.open("GET", url, false);

        request.onload = () => {
            if (request.status != 200) {
                return;
            }

            setJsonResponseStr = request.responseText;
        }

        request.send();

        return setJsonResponseStr;
    }

    function parseAndGetSmartCrops(setJsonResponseStr){
        const rePayload = new RegExp(/^(?:\/\*jsonp\*\/)?\s*([^()]+)\(([\s\S]+),\s*"[0-9]*"\);?$/gmi),
            rePayloadJSON = new RegExp(/^{[\s\S]*}$/gmi),
            resPayload = rePayload.exec(setJsonResponseStr);

        let payload;

        if (resPayload) {
            const payloadStr = resPayload[2];
            if (rePayloadJSON.test(payloadStr)) {
                payload = JSON.parse(payloadStr);
            }
        }

        if (payload && payload.set.relation && payload.set.relation.length > 0) {
            for (var i = 0; i < payload.set.relation.length; i++) {
                smartCrops[parseInt(payload.set.relation[i].userdata.SmartCropWidth)] =
                    ":" + payload.set.relation[i].userdata.SmartCropDef;
            }
        }
    }

    function isPublishedMode(){
        return (typeof Granite === 'undefined');
    }
})();