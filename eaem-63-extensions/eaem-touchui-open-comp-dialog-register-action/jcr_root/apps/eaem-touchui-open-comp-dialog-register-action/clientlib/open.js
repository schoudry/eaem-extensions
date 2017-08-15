(function ($document, author) {
    var openDialog = {
        icon: 'coral-Icon--game',
        text: 'Open Dialog',
        handler: function (editable, param, target) {
            author.DialogFrame.openDialog(new author.edit.Dialog(editable));
        },
        condition: function (editable) {
            //show this action only for component type eaem-touchui-open-comp-dialog-register-action/touchui-open-component-dialog
            return editable.type === "eaem-touchui-open-comp-dialog-register-action/touchui-open-component-dialog";
        },
        isNonMulti: true
    };

    $document.on('cq-layer-activated', function (ev) {
        if (ev.layer === 'Edit') {
            author.EditorFrame.editableToolbar.registerAction('EAEM_OPEN_DIALOG', openDialog);
        }
    });
})($(document), Granite.author);

