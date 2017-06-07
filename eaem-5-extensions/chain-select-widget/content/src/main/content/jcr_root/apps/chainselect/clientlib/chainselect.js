CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.ChainSelect = CQ.Ext.extend(CQ.Ext.Panel, {
    panelValue: '',

    constructor: function(config){
        config = config || {};

        if(!config.levels){
            config.levels = "1";
        }

        config.levels = parseInt(config.levels, 10);

        ExperienceAEM.ChainSelect.superclass.constructor.call(this, config);
    },

    getValue: function () {
        var pData = {};

        this.items.each(function(i){
            if(!i.level || i.xtype !== "combo" || i.disabled){
                return;
            }

            pData[i.level] = i.getValue();
        });

        return $.isEmptyObject(pData) ? "" : JSON.stringify(pData);
    },

    setValue: function (value) {
        var pData = JSON.parse(value);
        var levels = "", keywords = "", x = "", combo;

        for(x in pData){
            if(pData.hasOwnProperty(x)){
                levels = levels + x + ",";
                keywords = keywords + pData[x] + ",";
            }
        }

        levels = levels.substring(0, levels.lastIndexOf(","));
        keywords = keywords.substring(0, keywords.lastIndexOf(","));

        var lData = this.getDropDownData({ levels : levels, keywords: keywords });

        for(x in lData){
            if(lData.hasOwnProperty(x)){
                combo = this.findBy(function(comp){
                    return comp["level"] == x;
                }, this);

                combo[0].store.loadData(lData[x], false);
            }
        }

        this.items.each(function(i){
            if(!i.level || i.xtype !== "combo"){
                return;
            }

            if(pData[i.level]){
                i.setValue(pData[i.level]);
            }else{
                i.setDisabled(true);
            }
        });
    },

    validate: function(){
        return true;
    },

    getName: function(){
        return this.name;
    },

    getDropDownData: function(params){
        if(!params){
            params = { level : 1, keyword: "" }
        }

        var lData;

        $.ajax({
            url: '/bin/mycomponents/chainselect/dropdowndata',
            dataType: "json",
            type: 'GET',
            async: false,
            data: params,
            success: function(data){
                lData = data;
            }
        });

        return lData;
    },

    initComponent: function () {
        ExperienceAEM.ChainSelect.superclass.initComponent.call(this);

        var lData = this.getDropDownData();

        if(!lData){
            CQ.Ext.Msg.alert("Error","Error getting levels data or no data available");
            return;
        }

        for(var x = 1; x <= this.levels; x++){
            this.add(new CQ.Ext.form.ComboBox({
                store: new CQ.Ext.data.ArrayStore({
                    fields: ["id", "text"],
                    data: lData[x]
                }),
                mode: "local",
                triggerAction: "all",
                isFormField: false,
                level: x,
                fieldLabel: "Level " + x,
                valueField: 'id',
                displayField: 'text',
                emptyText: 'Select level ' + x,
                style: "margin-bottom:20px",
                xtype: 'combo',
                listeners:{
                    scope: this,
                    select: function(combo){
                        var keyword = combo.getValue();

                        var lowCombo = this.findBy(function(comp){
                            return comp["level"] == (combo.level + 1);
                        }, this);

                        if(!lowCombo || (lowCombo.length == 0)){
                            return;
                        }

                        lData = this.getDropDownData({ level : combo.level + 1, keyword: keyword });
                        var level = combo.level + 1;

                        do{
                            lowCombo = this.findBy(function(comp){
                                return comp["level"] == level;
                            }, this);

                            if(!lowCombo || (lowCombo.length == 0)){
                                break;
                            }

                            lowCombo = lowCombo[0];
                            lowCombo.clearValue();

                            if(lData[lowCombo.level]){
                                lowCombo.setDisabled(false);
                                lowCombo.store.loadData(lData[lowCombo.level], false);
                            }else{
                                lowCombo.setDisabled(true);
                            }

                            level = lowCombo.level + 1;
                        }while(true);
                    }
                }
            }));
        }

        this.panelValue = new CQ.Ext.form.Hidden({
            name: this.name
        });

        this.add(this.panelValue);

        var dialog = this.findParentByType('dialog');

        dialog.on('beforesubmit', function(){
            var value = this.getValue();

            if(value){
                this.panelValue.setValue(value);
            }
        },this);

        this.panelValue.on('loadcontent', function(){
            this.setValue(this.panelValue.getValue());
        },this);
    }
});

CQ.Ext.reg("chainselect", ExperienceAEM.ChainSelect);