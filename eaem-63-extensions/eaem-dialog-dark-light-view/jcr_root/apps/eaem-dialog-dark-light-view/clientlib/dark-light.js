(function ($, $document) {
    $document.on("dialog-ready", handler);

    function handler(){
        var dialog = $("coral-dialog"),
            actions = dialog.find(".cq-dialog-actions");

        var bg = $(getButtonHtml()).prependTo(actions);

        bg.click(function(event){
            event.preventDefault();
            dialog.toggleClass("coral--dark");
        });
    }

    function getButtonHtml(){
        return '<button class="cq-dialog-header-action coral-Button coral-Button--minimal" title="Background Dark/Light">' +
                    '<coral-icon icon="lightbulb" size="S"/>' +
                '</button>';
    }
})(jQuery, jQuery(document));