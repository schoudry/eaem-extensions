(function ($document, gAuthor) {
    $document.on("dialog-ready", showParsysPath);

    function showParsysPath(){
        var dialog = gAuthor.DialogFrame.currentDialog,
            parent = dialog.editable.getParent();

        if(!parent){
            return;
        }

        showMessage("Parent", parent.path);
    }

    function showMessage(title, message){
        $(window).adaptTo('foundation-ui').prompt(title, message, "default", [{
            primary: true,
            text: Granite.I18n.get('OK')
        }]);
    }
}($(document), Granite.author));