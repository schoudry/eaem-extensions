CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.MultiFieldPanel = CQ.Ext.extend(CQ.Ext.Panel, {
    constructor: function(config){
        config = config || {};
        ExperienceAEM.MultiFieldPanel.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        ExperienceAEM.MultiFieldPanel.superclass.initComponent.call(this);

        function addName(items, prefix, counter){
            items.each(function(i){
                if(!i.hasOwnProperty("dName")){
                    return;
                }

                i.name = prefix + "/" + (counter) + "/" + i.dName;

                //workaround for xtype select
                if(i.hiddenField){
                    i.hiddenField.name = prefix + "/" + (counter) + "/" + i.dName;
                }

                if(i.el && i.el.dom){ //form serialization workaround
                    i.el.dom.name = prefix + "/" + (counter) + "/" + i.dName;
                }
            },this);
        }

        var multi = this.findParentByType("multifield"),
            multiPanels = multi.findByType("multi-field-panel");

        addName(this.items, this.name, multiPanels.length + 1);

        multi.on("removeditem", function(){
            multiPanels = multi.findByType("multi-field-panel");

            for(var x = 1; x <= multiPanels.length; x++){
                addName(multiPanels[x-1].items, multiPanels[x-1].name, x);
            }
        });
    },

    afterRender : function(){
        ExperienceAEM.MultiFieldPanel.superclass.afterRender.call(this);

        this.items.each(function(){
            if(!this.contentBasedOptionsURL
                || this.contentBasedOptionsURL.indexOf(CQ.form.Selection.PATH_PLACEHOLDER) < 0){
                return;
            }

            this.processPath(this.findParentByType('dialog').path);
        })
    },

    getValue: function () {
        var pData = {};

        this.items.each(function(i){
            if(!i.hasOwnProperty("dName")){
                return;
            }

            pData[i.dName] = i.getValue();
        });

        return pData;
    },

    setValue: function (value) {
        var counter = 1, item,
            multi = this.findParentByType("multifield"),
            multiPanels = multi.findByType("multi-field-panel");

        if(multiPanels.length == 1){
            item = value[counter];
        }else{
            item = value;
        }

        this.items.each(function(i){
            if(!i.hasOwnProperty("dName")){
                return;
            }

            i.setValue(item[i.dName]);
        });

        if(multiPanels.length == 1){
            while(true){
                item = value[++counter];

                if(!item){
                    break;
                }

                multi.addItem(item);
            }
        }
    },

    validate: function(){
        return true;
    },

    getName: function(){
        return this.name;
    }
});

CQ.Ext.reg("multi-field-panel", ExperienceAEM.MultiFieldPanel);