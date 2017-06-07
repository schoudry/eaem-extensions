CQ.Ext.ns("RichTextMultiField");

RichTextMultiField.RichText = CQ.Ext.extend(CQ.form.RichText, {
    afterRender: function() {
        RichTextMultiField.RichText.superclass.afterRender.call(this);

        var dialog = this.findParentByType('dialog');
        var target = this.dropTargets[0];

        if (dialog && dialog.el && target.highlight) {
            var dialogZIndex = parseInt(dialog.el.getStyle("z-index"), 10);

            if (!isNaN(dialogZIndex)) {
                target.highlight.zIndex = dialogZIndex + 1;
            }
        }

        target.parentMultiFieldItem = this.findParentByType("multifielditem");

        var multifield = this.findParentByType('multifield');

        if(!multifield.dropTargets){
            multifield.dropTargets = [];

            dialog.on('hide', function (){
                multifield.dropTargets = [];
            });

            multifield.on("removeditem", function(panel){
                resetDropTargets.call(this, panel);
            });
        }

        multifield.dropTargets.push(target);

        this.dropTargets = undefined;

        function resetDropTargets(panel){
            var dropTargets = [];

            var itemFields = panel.findByType("multifielditem");

            if(_.isEmpty(itemFields)){
                return;
            }

            var itemFieldsIds = _.pluck(itemFields, "id");

            CQ.Ext.each(this.dropTargets, function(dTarget){
                if(_.contains(itemFieldsIds, dTarget.parentMultiFieldItem.id)){
                    dropTargets.push(dTarget);
                }
            }, this);

            this.dropTargets = dropTargets;
        }
    },

    syncValue: function() {
        if(!this.el || !this.el.dom){
            return;
        }
        RichTextMultiField.RichText.superclass.syncValue.call(this);
    }
});

CQ.Ext.reg('mrichtext', RichTextMultiField.RichText);