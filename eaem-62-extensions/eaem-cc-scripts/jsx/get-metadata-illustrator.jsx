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

    EAEM.getMetaData = getMetaData;

    function getMetaData(props) {
        var propValues = {};

        try {
            var propsArr = JSON.parse(props), nUri, property,
                xmp = new XMPMeta(app.activeDocument.XMPString);

            for (var x = 0; x < propsArr.length; x++) {
                if (!xmp.doesPropertyExist(EAEM.NS_URI, propsArr[x])) {
                    continue;
                }

                property = xmp.getProperty(EAEM.NS_URI, propsArr[x]);

                if (property.options & XMPConst.PROP_IS_ARRAY) {
                    var count = xmp.countArrayItems(EAEM.NS_URI, propsArr[x]),
                        resArr = [];

                    for (var k = 1; k <= count; k++) {
                        resArr.push(xmp.getArrayItem(EAEM.NS_URI, propsArr[x], k).toString());
                    }

                    propValues[propsArr[x]] = resArr;
                }else{
                    propValues[propsArr[x]] = property.value;
                }
            }
        }
        catch (err) {
            propValues = ERROR + "-" + err.message;
        }

        return JSON.stringify(propValues);
    }

    function testGetMetadata(){
        var metadata = [ "abbr", "title", "products" ];

        var result = getMetaData(JSON.stringify(metadata));

        $.writeln("result -> " + result);
    }

    init();

    testGetMetadata();
})();
