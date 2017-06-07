(function ($, $document, gAuthor) {
    if(!gAuthor){
        return;
    }

    $document.on('dialog-ready', openPagePropertiesFullScreen);

    function openPagePropertiesFullScreen(){
        var currentDialog = gAuthor.DialogFrame.currentDialog;

        //if the current dialog is page properties
        if(currentDialog instanceof gAuthor.actions.PagePropertiesDialog){
            $('form.cq-dialog').find(".cq-dialog-layouttoggle").click();
        }
    }
}(jQuery, jQuery(document), Granite.author));