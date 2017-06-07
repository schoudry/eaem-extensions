(function(){
    var EAEM_LINK_DIALOG = CQ.Ext.extend(CQ.form.rte.plugins.LinkDialog, {
        constructor: function(config) {
            config = config || {};

            EAEM_LINK_DIALOG.superclass.constructor.call(this, config);

            var pathField = this.findByType("pathfield")[0];

            pathField.on("dialogopen", function(){
                this.browseDialog.treePanel.on('load', showNodeName);
            });

            function showNodeName(node){
                _.each(node.childNodes, function(childNode){
                    //set the nodename replacing jcr:title (folders) or dc:title (assets)
                    childNode.setText(childNode.attributes.name);
                });
            }
        }
    });

    CQ.Ext.reg("rtelinkdialog", EAEM_LINK_DIALOG);
}());

