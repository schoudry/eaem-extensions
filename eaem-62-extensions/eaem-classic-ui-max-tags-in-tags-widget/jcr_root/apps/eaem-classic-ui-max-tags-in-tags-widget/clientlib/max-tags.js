(function(){
    var EAEM_MAX_TAGS_CONFIG = "eaemMaxTags";

    var EAEM_TAG_INPUT_FIELD = CQ.Ext.extend(CQ.tagging.TagInputField, {
        checkMaximum: function(tag) {
            var limit = this.initialConfig[EAEM_MAX_TAGS_CONFIG];

            if(limit && this.tags.length >= parseInt(limit)){
                var msgBox = CQ.Ext.Msg.alert('Limit exceeded', "Maximum tags allowed of any namespace: " + limit);
                msgBox.getDialog().setZIndex(99999);
                return false;
            }

            return EAEM_TAG_INPUT_FIELD.superclass.checkMaximum.call(this, tag);
        }
    });

    CQ.Ext.reg("tags", EAEM_TAG_INPUT_FIELD);
}());