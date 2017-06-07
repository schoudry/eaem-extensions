(function ($) {
    var EAEM_CHECK_DATE_AFTER = "eaemcheckdateafter",
        fieldErrorEl = $("<span class='coral-Form-fielderror coral-Icon coral-Icon--alert coral-Icon--sizeS' " +
                            "data-init='quicktip' data-quicktip-type='error' />");

    $.validator.register({
        selector: "input",
        validate: validate, //if validate() returns a non empty value, show() is called
        show: show,
        clear: clear
    });

    function validate($el){
        //if not date widget or widget value is empty, return
        if(!$el.parent().hasClass("coral-DatePicker") || _.isEmpty($el.val())){
            return;
        }

        var $datePicker = $el.parent(),
            $form = $datePicker.closest("form"),
            checkDateAfter = $datePicker.data(EAEM_CHECK_DATE_AFTER);

        if(_.isEmpty(checkDateAfter)){
            return;
        }

        var $toCompareField = $form.find("[name='" + checkDateAfter + "']");

        if(_.isEmpty($toCompareField) || _.isEmpty($toCompareField.val())){
            return;
        }

        var toCompareMillis = new Date($toCompareField.val()).getTime(),
            compareWithMillis = new Date($el.val()).getTime(),
            text = $toCompareField.closest(".coral-Form-fieldwrapper").find(".coral-Form-fieldlabel").html();

        return ( compareWithMillis < toCompareMillis) ? "Should not be less than '" + text + "'" : null;
    }

    function show($el, message){
        if(!$el.parent().hasClass("coral-DatePicker")){
            return;
        }

        var $datePicker = $el.parent();

        this.clear($el);

        var arrow = $datePicker.closest("form").hasClass("coral-Form--vertical") ? "right" : "top";

        $el.attr("aria-invalid", "true").toggleClass("is-invalid", true);

        fieldErrorEl.clone()
            .attr("data-quicktip-arrow", arrow)
            .attr("data-quicktip-content", message)
            .insertAfter($datePicker);
    }

    function clear($el){
        if(!$el.parent().hasClass("coral-DatePicker")){
            return;
        }

        var $datePicker = $el.parent();

        $el.removeAttr("aria-invalid").removeClass("is-invalid");

        $datePicker.nextAll(".coral-Form-fielderror").tooltip("hide").remove();
    }
}(jQuery));