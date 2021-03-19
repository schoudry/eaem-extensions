(function ($, ns, channel) {
    var _orignTitleFn, _orignBindFn;

    channel.on("cq-editor-loaded", $.debounce(500, false, extendContentTree));

    function extendContentTree(){
        var contentTree = Granite.author.ui.contentTree;

        _orignTitleFn = contentTree._getElementTitle;
        _orignBindFn = contentTree._bindListeners;

        if (_.isEmpty(contentTree.editables)) {
            return;
        }

        contentTree._getElementTitle = getElementTitle;

        contentTree._bindListeners = bindListeners;
    }

    function getElementTitle(editable, componentTitle){
        var titleHtml = _orignTitleFn.call(this, editable, componentTitle),
            buttonDeleteHtml = '&lt;coral-icon icon="delete" size="M" class="eaem-contenttree-delete" data-content-align="Top"&gt;&lt;/coral-icon&gt;',
            buttonInsertHtml = '&lt;coral-icon icon="add" size="M" class="eaem-contenttree-insert" data-content-align="Top"&gt;&lt;/coral-icon&gt;',
            padding = '&lt;span style="margin-left: 20px"&gt;&lt;/span&gt;';

        if (titleHtml) {
            if (editable.name == "responsivegrid") {
                //dont add delete or insert
            }else if (!editable.config.isContainer) {
                titleHtml = titleHtml + padding + buttonDeleteHtml;
            }else{
                titleHtml = titleHtml + padding + buttonDeleteHtml + buttonInsertHtml;
            }
        }

        return titleHtml;
    }

    function bindListeners(){
        var editables = this.editables;

        _orignBindFn.call(this);

        $(".eaem-contenttree-insert").click(function(event){
            var treeItem = event.currentTarget.closest("coral-tree-item"),
                editable = editables.find(treeItem.value)[0];

            ns.edit.ToolbarActions.INSERT.execute(editable);
        });

        $(".eaem-contenttree-delete").click(function (event) {
            var treeItem = event.currentTarget.closest("coral-tree-item"),
                editable = editables.find(treeItem.value)[0];

            if (editable && editable.overlay && editable.overlay.dom && !editable.overlay.isDisabled()
                    &&!editable.overlay.isSelected()) {
                editable.overlay.dom.focus().trigger("click");
            }

            if (editable) {
                ns.edit.ToolbarActions.DELETE.execute(editable);
            }
        });
    }
}(jQuery, Granite.author, jQuery(document)));

