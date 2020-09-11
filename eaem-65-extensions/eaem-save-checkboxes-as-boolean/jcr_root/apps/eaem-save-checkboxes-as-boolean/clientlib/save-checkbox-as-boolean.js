(function($, $document){
    var CHECK_BOX_SEL = "form.cq-dialog input[type='checkbox']";

    $document.on("click", ".cq-dialog-submit", convertStringToBoolean);

    function convertStringToBoolean(event){
        event.stopPropagation();
        event.preventDefault();

        $(CHECK_BOX_SEL).each(addTypeHint);

        $("form.cq-dialog").submit();
    }

    function addTypeHint(){
        var $checkbox = $(this),
            value = $checkbox.val(),
            $form = $("form.cq-dialog");

        if( (value != "true") && (value != "false")){
            return;
        }

        var typeHintName = $checkbox.attr("name") + "@TypeHint";

        $form.append($("<input type='hidden'/>").attr("name", typeHintName).attr("value", "Boolean"));
    }
}(jQuery, jQuery(document)));