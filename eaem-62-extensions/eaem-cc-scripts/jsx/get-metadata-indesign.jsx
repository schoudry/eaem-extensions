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
            var propsArr = JSON.parse(props), nUri, propertyValue,
                xmp = app.activeDocument.metadataPreferences;

            for (var x = 0; x < propsArr.length; x++) {
                propertyValue = xmp.getProperty(EAEM.NS_URI, propsArr[x]);

                if(!propertyValue){
                    propertyValue = getXMPArrayData(xmp, EAEM.NS_URI, propsArr[x]);
                }

                if(propertyValue){
                    propValues[propsArr[x]] = propertyValue;
                }
            }
        }
        catch (err) {
            propValues = ERROR + "-" + err.message;
        }

        return JSON.stringify(propValues);
    }

    function getXMPArrayData(xmp, nUri, propertyName){
        var index = 1, values = [],
            propertyValue = xmp.getProperty(nUri, propertyName + "[" + index++ + "]");

        //its an array
        if(!propertyValue) {
            return values;
        }

        do{
            values.push(propertyValue);

            propertyValue = xmp.getProperty(nUri, propertyName + "[" + index++ + "]");

            if(!propertyValue){
                break;
            }
        }while(true);

        return values;
    }

    function testGetMetadata(){
        var metadata = [ "abbr", "title", "products" ];

        var result = getMetaData(JSON.stringify(metadata));

        $.writeln("result -> " + result);
    }

    init();

    testGetMetadata();
})();
