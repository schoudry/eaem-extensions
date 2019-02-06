(function ($, $document, gAuthor) {
    var COUNT_SELECT = "./count",
        PRODUCTS_MF = "./products";

    $document.on("dialog-ready", addSelectListener);

    function addSelectListener(){
        var $countSelect = $("coral-select[name='" + COUNT_SELECT + "']");

        if(_.isEmpty($countSelect)){
            return;
        }

        var countSelect = $countSelect[0];

        countSelect.on("change", adjustMultifieldItems);

    }

    function adjustMultifieldItems(event){
        var countSelect = event.target,
            $productsMF = $("coral-multifield[data-granite-coral-multifield-name='" + PRODUCTS_MF + "']");

        if(_.isEmpty($productsMF)){
            return;
        }

        var maxCount = parseInt(countSelect.value),
            productsMF = $productsMF[0],
            mfItems = productsMF.items.getAll();

        if(mfItems.length <= maxCount){
            for(var c = mfItems.length; c < maxCount; c++){
                productsMF.items.add();
            }
        }else{
            for(var c = (mfItems.length - 1) ; c >= maxCount; c--){
                productsMF.items.remove(mfItems[c]);
            }
        }
    }
}(jQuery, jQuery(document), Granite.author));