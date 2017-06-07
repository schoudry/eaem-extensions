Ext.ns("ExperienceAEM");

ExperienceAEM.PASSWORD = "Password";

ExperienceAEM.PropertyPanel = Ext.extend(CRX.ide.PropertyPanel,{
    MASK: "****",

    constructor: function(config){
        ExperienceAEM.PropertyPanel.superclass.constructor.call(this, config);

        var eThis = this;

        this.types.store.loadData([ExperienceAEM.PASSWORD],true);

        var valueColumn = this.getColumnModel().getColumnById("value");

        valueColumn.renderer = function(value, p, record) {
            var rValue = Ext.grid.Column.prototype.renderer.call(this, value, p, record);

            if( (typeof rValue) != "string"){
                return rValue;
            }

            var indexOfPassword = rValue.indexOf(ExperienceAEM.PASSWORD + ":");

            if( indexOfPassword == 0){
                record.data.type = ExperienceAEM.PASSWORD;
            }

            return (record.data.type == ExperienceAEM.PASSWORD) ? eThis.MASK : rValue;
        };
    },

    initValue: function() {
        ExperienceAEM.PropertyPanel.superclass.initValue.call(this);

        this.value[ExperienceAEM.PASSWORD] = {
            xtype: "textfield",
            inputType: "password",
            allowBlank: true,
            disableKeyFilter: true,
            cls: "x-form-text",
            tabIndex: 102
        };
    }
});

Ext.reg("propertypanel", ExperienceAEM.PropertyPanel);

(function(){
    var handler = CRX.ide.SaveAllAction.initialConfig.handler;

    CRX.ide.SaveAllAction.initialConfig.handler = function(){
        var workspaces = CRX.Util.getWorkspaces();
        var dirtyPassRecs = [];

        workspaces.each(function(workspace) {
            var paths = CRX.State.getChangedPaths("/" + workspace + "/");

            if (paths.length == 0) {
                return;
            }

            Ext.each(paths, function(path){
                var records = CRX.State.getPropertyRecords(path);

                Ext.each(records, function(record) {
                    if ( (record.data.type !== ExperienceAEM.PASSWORD) || !record.dirty){
                        return;
                    }

                    record.data.type = CRX.util.STRING;
                    //comment the below line if you use encryption
                    record.data.value = ExperienceAEM.PASSWORD + ":" + record.data.value;

                    dirtyPassRecs.push(record);
                });
            });
        });

        var words = [];

        Ext.each(dirtyPassRecs, function(record) {
            words.push(record.data.value);
        });

        /*
        uncomment this block to use encryption
        //http://experience-aem.blogspot.com/2014/11/aem-6-sp1-servlet-for-encryption-decryption.html
        Ext.Ajax.request({
            url: "/bin/experienceaem/encrypt?words=" + words.join(","),
            success: function(response) {
                var words = JSON.parse(response.responseText);

                Ext.each(dirtyPassRecs, function(record) {
                    record.data.value = ExperienceAEM.PASSWORD + ":" + words[record.data.value];
                });

                handler();

                Ext.each(dirtyPassRecs, function(record) {
                    record.data.type = ExperienceAEM.PASSWORD;
                });
            }
        });*/

        //start: comment the below lines to use encryption
        handler();

        Ext.each(dirtyPassRecs, function(record) {
            record.data.type = ExperienceAEM.PASSWORD;
        });
        //end:
    }
})();
