(function ($document, author) {
    var openDialog = {
        icon: 'coral-Icon--game',
        text: 'Open Dialog',
        handler: function (editable, param, target) {
            author.DialogFrame.openDialog(editable);
        },
        condition: function (editable) {
            return editable.type === "touchui-open-component-dialog-register-action/touchui-open-component-dialog";
        },
        isNonMulti: true
    };

    $document.on('cq-layer-activated', function (ev) {
        if (ev.layer === 'Edit') {
            author.EditorFrame.editableToolbar.registerAction('EAEM_OPEN_DIALOG', openDialog);
        }
    });
})($(document), Granite.author);

