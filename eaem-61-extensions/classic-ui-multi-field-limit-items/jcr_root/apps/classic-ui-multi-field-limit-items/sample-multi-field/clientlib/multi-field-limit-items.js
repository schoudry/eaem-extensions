CQ.Ext.ns("ExperienceAEM");

ExperienceAEM.LimitMultiField = CQ.Ext.extend(CQ.form.MultiField, {
    initComponent: function () {
        ExperienceAEM.LimitMultiField.superclass.initComponent.call(this);

        if(!this.limit){
            return;
        }

        this.on("beforeadd", function(){
            var items = this.findByType(this.fieldConfig.xtype);

            if(items.length < parseInt(this.limit)){
                return;
            }

            CQ.Ext.Msg.alert('Error', 'More than ' + this.limit + " not allowed");

            return false;
        });
    }
});

CQ.Ext.reg("limit-multifield", ExperienceAEM.LimitMultiField);