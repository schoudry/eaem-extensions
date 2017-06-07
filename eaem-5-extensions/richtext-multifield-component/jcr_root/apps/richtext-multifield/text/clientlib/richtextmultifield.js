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

        var multifield = this.findParentByType('multifield');

        if(!multifield.dropTargets){
            multifield.dropTargets = [];
        }

        multifield.dropTargets.push(target);
        this.dropTargets = undefined;
    },

    syncValue: function() {
        if(!this.el || !this.el.dom){
            return;
        }
        RichTextMultiField.RichText.superclass.syncValue.call(this);
    }
});

CQ.Ext.reg('mrichtext', RichTextMultiField.RichText);