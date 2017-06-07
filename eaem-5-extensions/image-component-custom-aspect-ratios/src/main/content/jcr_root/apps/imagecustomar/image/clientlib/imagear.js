var MyClientLib = MyClientLib || {};

MyClientLib.Html5SmartImage = CQ.Ext.extend(CQ.html5.form.SmartImage, {
    crops: {},

    constructor: function (config) {
        config = config || {};

        var aRatios = {
            "freeCrop": {
                "value": "0,0",
                "text": CQ.I18n.getMessage("Free crop")
            }
        };

        var tObj = this;

        $.each(config, function (key, value) {
            if (key.endsWith("AspectRatio")) {
                var text = config[key + "Text"];

                if (!text) {
                    text = key;
                }

                if (!value) {
                    value = "0,0";
                }

                aRatios[key] = {
                    "value": value,
                    "text": text
                };

                tObj.crops[key] = { text: text, cords : ''};
            }
        });

        var defaults = { "cropConfig": { "aspectRatios": aRatios } };
        config = CQ.Util.applyDefaults(config, defaults);

        MyClientLib.Html5SmartImage.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        MyClientLib.Html5SmartImage.superclass.initComponent.call(this);

        var imgTools = this.imageToolDefs;
        var cropTool;

        if(imgTools){
            for(var x = 0; x < imgTools.length; x++){
                if(imgTools[x].toolId == 'smartimageCrop'){
                    cropTool = imgTools[x];
                    break;
                }
            }
        }

        if(!cropTool){
            return;
        }

        for(var x in this.crops){
            if(this.crops.hasOwnProperty(x)){
                var field = new CQ.Ext.form.Hidden({
                    id: x,
                    name: "./" + x
                });

                this.add(field);

                field = new CQ.Ext.form.Hidden({
                    name: "./" + x + "Text",
                    value: this.crops[x].text
                });

                this.add(field);
            }
        }

        var userInterface = cropTool.userInterface;

        this.on("loadimage", function(){
            var aRatios = userInterface.aspectRatioMenu.findByType("menucheckitem");

            if(!aRatios){
                return;
            }

            for(var x = 0; x < aRatios.length; x++){
                if(aRatios[x].text !== "Free crop"){
                    aRatios[x].on('click', function(radio){
                        var key = this.getCropKey(radio.text);

                        if(!key){
                            return;
                        }

                        if(this.crops[key].cords){
                            this.setCoords(cropTool, this.crops[key].cords);
                        }else{
                            var field = CQ.Ext.getCmp(key);
                            this.crops[key].cords = this.getRect(radio, userInterface);
                            field.setValue(this.crops[key].cords);
                        }
                    },this);
                }

                var key = this.getCropKey(aRatios[x].text);

                if(key && this.dataRecord && this.dataRecord.data[key]){
                    this.crops[key].cords = this.dataRecord.data[key];

                    var field = CQ.Ext.getCmp(key);
                    field.setValue(this.crops[key].cords);
                }
            }
        });

        cropTool.workingArea.on("contentchange", function(changeDef){
            var aRatios = userInterface.aspectRatioMenu.findByType("menucheckitem");
            var aRatioChecked;

            if(aRatios){
                for(var x = 0; x < aRatios.length; x++){
                    if(aRatios[x].checked === true){
                        aRatioChecked = aRatios[x];
                        break;
                    }
                }
            }

            if(!aRatioChecked){
                return;
            }

            var key = this.getCropKey(aRatioChecked.text);
            var field = CQ.Ext.getCmp(key);

            this.crops[key].cords = this.getRect(aRatioChecked, userInterface);
            field.setValue(this.crops[key].cords);
        }, this);
    },

    getCropKey: function(text){
        for(var x in this.crops){
            if(this.crops.hasOwnProperty(x)){
                if(this.crops[x].text == text){
                    return x;
                }
            }
        }

        return null;
    },

    getRect: function (radio, ui) {
        var ratioStr = "";
        var aspectRatio = radio.value;

        if ((aspectRatio != null) && (aspectRatio != "0,0")) {
            ratioStr = "/" + aspectRatio;
        }

        if (ui.cropRect == null) {
            return ratioStr;
        }

        return ui.cropRect.x + "," + ui.cropRect.y + "," + (ui.cropRect.x + ui.cropRect.width) + ","
            + (ui.cropRect.y + ui.cropRect.height) + ratioStr;
    },

    setCoords: function (cropTool, cords) {
        cropTool.initialValue = cords;
        cropTool.onActivation();
    }
});

CQ.Ext.reg("myhtml5smartimage", MyClientLib.Html5SmartImage);
