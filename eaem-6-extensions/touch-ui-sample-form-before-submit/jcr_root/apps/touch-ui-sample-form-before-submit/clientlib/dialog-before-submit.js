(function (document, $, ns) {
    "use strict";

    $(document).on("click", ".cq-dialog-submit", function (e) {
        e.stopPropagation();
        e.preventDefault();

        var $form = $(this).closest("form.foundation-form"),
            title = $form.find("[name='./jcr:title']").val(),
            message, clazz = "coral-Button ";

        if(!title){
            message = "Title is empty. Are you sure?";
            clazz = clazz + "coral-Button--warning";
        }else{
            message = "Title is '" + title + "'. Submit?";
            clazz = clazz + "coral-Button--primary";
        }

        ns.ui.helpers.prompt({
            title: Granite.I18n.get("Confirm"),
            message: message,
            actions: [{
                    id: "CANCEL",
                    text: "CANCEL",
                    className: "coral-Button"
                },{
                    id: "SUBMIT",
                    text: "SUBMIT",
                    className: clazz
                }
            ],
            callback: function (actionId) {
                if (actionId === "SUBMIT") {
                    $form.submit();
                }
            }
        });
    });
})(document, Granite.$, Granite.author);
