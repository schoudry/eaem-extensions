#include "json2.jsx"

(function () {
    if (typeof EAEM == "undefined") {
        EAEM = {};
    }

    EAEM.NS_EAEM = "NS_EAEM";
    EAEM.NS_URI = "http://experience-aem.blogspot.com/eaem";
    EAEM.NS_PREFIX = "eaem";

    var ERROR = "ERROR",
        SUCCESS = "SUCCESS";

    function init() {
        ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
        XMPMeta.registerNamespace(EAEM.NS_URI, EAEM.NS_PREFIX);
    }

    EAEM.setMetaData = setMetaData;

    function setMetaData(namespace, metadataJSONstr) {
        var result = ERROR;

        try {
            var doc = app.activeDocument,
                metadataObj = JSON.parse(metadataJSONstr),
                value, nUri = (namespace === EAEM.NS_EAEM) ? EAEM.NS_URI : XMPConst[namespace],
                xmp = doc.metadataPreferences;

            for (var x in metadataObj) {
                if (!metadataObj.hasOwnProperty(x)) {
                    continue;
                }

                value = metadataObj[x];

                xmp.setProperty(nUri, x, '');

                if (!value) {
                    continue;
                }

                if (value instanceof Array) {
                    if (value.length > 0) {
                        xmp.createContainerItem(nUri, x, undefined, ContainerType.BAG);

                        for (var y = 1; y <= value.length; y++) {
                            xmp.setProperty(nUri, x + "[" + y + "]", value[y - 1]);
                        }
                    }
                } else {
                    xmp.setProperty(nUri, x, value);
                }
            }

            result = SUCCESS;
        } catch (err) {
            result = ERROR + "-" + err.message;
        }

        return result;
    }

    function testSetMetadata(){
        var metadata = {
            "abbr" : "AEM",
            "title" : "Adobe Experience Manager"
        };

        var result = setMetaData("NS_EAEM", JSON.stringify(metadata));

        $.writeln("result -> " + result);
    }

    function testSetMetadataArray(){
        var metadata = {
            "products" : [ "Sites", "Assets", "Mobile"]
        };

        var result = setMetaData("NS_EAEM", JSON.stringify(metadata));

        $.writeln("result -> " + result);
    }

    init();

    testSetMetadata();

    testSetMetadataArray();
})();
