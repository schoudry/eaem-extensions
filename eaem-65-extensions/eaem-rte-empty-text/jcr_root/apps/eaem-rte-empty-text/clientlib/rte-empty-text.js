(function($, $document){
    var RTE_SEL = "[data-cq-richtext-editable='true']",
        DATA_PLACE_HOLDER = "data-eaem-rte-placeholder",
        PLACE_HOLDER_CSS = "eaem-rte-placeholder";

    $document.on("dialog-ready", function(){
        $(RTE_SEL).each(addPlaceHolderTextInData);
    });

    $document.on("click", ".cq-dialog-submit", handleBeforeSubmit);

    function handleBeforeSubmit(e){
        e.stopPropagation();
        e.preventDefault();

        $(RTE_SEL).each(clearPlaceholderText);

        var $form = $(this).closest("form.foundation-form"),
            $rteInputs = $form.find("[data-cq-richtext-input='true']");

        _.each($rteInputs, function(input){
            var $input = $(input),
                val = $input.val();

            if(!val.includes(PLACE_HOLDER_CSS)){
                return;
            }

            $input.val(getPlaceHolderTextRemovedFromRTEInput(val));
        });

        $form.submit();
    }

    function getPlaceHolderTextRemovedFromRTEInput(val){
        //todo: when there is no text, placeholder is getting saved, find a better way to remove
        return val.substring(val.indexOf("</div>") + 6);
    }

    function addPlaceholderText(){
        var $rte = $(this),
            text = $rte.text().trim(),
            placeholderText = $rte.attr(DATA_PLACE_HOLDER);

        if(!placeholderText){
            return;
        }

        if(text){
            $rte.find("." + PLACE_HOLDER_CSS).remove();
        }else{
            $rte.prepend(getPlaceholder(placeholderText));
        }
    }

    function clearPlaceholderText(){
        $(this).find("." + PLACE_HOLDER_CSS).remove();
    }

    function getPlaceholder(text){
        return "<div class='" + PLACE_HOLDER_CSS + "'>" + text + "</div>";
    }

    function addPlaceHolderTextInData(index, rte){
        var $rte = $(rte),
            configPath = $rte.attr("data-config-path");

        if(!configPath){
            return;
        }

        $.ajax(configPath).done(function(data){
            var emptyText = data["emptyText"];

            if(!emptyText){
                return;
            }

            $rte.attr(DATA_PLACE_HOLDER, emptyText);

            $rte.change(addPlaceholderText);

            $rte.click(clearPlaceholderText);

            addPlaceholderText.call($rte[0]);
        })
    }
}(jQuery, jQuery(document)));
