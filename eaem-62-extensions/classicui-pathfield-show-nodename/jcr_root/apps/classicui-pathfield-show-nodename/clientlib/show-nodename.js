(function(){
    var EAEM_PATH_FIELD = CQ.Ext.extend(CQ.form.PathField, {
        onTriggerClick: function() {
            EAEM_PATH_FIELD.superclass.onTriggerClick.call(this);

            this.browseDialog.treePanel.on('load', showNodeName);

            function showNodeName(node){
                _.each(node.childNodes, function(childNode){
                    //set the nodename replacing jcr:title (folders) or dc:title (assets)
                    childNode.setText(childNode.attributes.name);
                });
            }
        }
    });

    CQ.Ext.reg("pathfield", EAEM_PATH_FIELD);
}());