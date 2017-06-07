var MyClientLib = MyClientLib || {};

MyClientLib.StepCombo = CQ.Ext.extend(CQ.Ext.form.ComboBox, {
    constructor: function(config){
        config = config || {};

        config.store = new CQ.Ext.data.Store({
            proxy: new CQ.Ext.data.HttpProxy({
                "autoLoad":false,
                url: "/bin/mycomponents/groupsusers",
                method: 'GET'
            }),
            reader: new CQ.Ext.data.JsonReader({
                root: 'data',
                fields: [
                    {name: 'id', mapping: 'id'},
                    {name: 'text', mapping: 'text'},
                    {name: 'group', mapping: 'group'}
                ]
            })
        });

        config.mode = "remote";
        config.triggerAction = "all";
        config.valueField = 'id';
        config.displayField = 'text';

        config.tpl ='<tpl for=".">' +
                        '<tpl if="!group">' +
                            '<div class="x-combo-list-item" style="margin-left: 20px">{text}</div>' +
                        '</tpl>' +
                        '<tpl if="group == \'y\'">' +
                            '<div class="x-combo-list-item" ><b>{text}</b></div>' +
                        '</tpl>' +
                    '</tpl>';

        MyClientLib.StepCombo.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        MyClientLib.StepCombo.superclass.initComponent.call(this);

        var resizeFn = function(combo){
            var size = combo.getSize();
            size.width = 200;
            combo.setSize(size);
        };

        this.on('loadcontent', resizeFn);
    }
});

CQ.Ext.reg("stepcombo", MyClientLib.StepCombo);
