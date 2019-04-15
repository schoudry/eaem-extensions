(function ($, $document) {
    var COMPOSITE_MULTIFIELD_SELECTOR = "coral-multifield[data-granite-coral-multifield-composite]";

    $document.on("foundation-contentloaded", function(e) {
        var composites = $(COMPOSITE_MULTIFIELD_SELECTOR, e.target);

        composites.each(function() {
            Coral.commons.ready(this, function(el) {
                selectRadioValue(el);
            });
        });
    });

    function selectRadioValue(multifield){
        var $multifield = $(multifield),
            dataPath = $multifield.closest(".cq-dialog").attr("action"),
            mfName = $multifield.attr("data-granite-coral-multifield-name");

        dataPath = dataPath + "/" + getStringAfterLastSlash(mfName);

        $.ajax({
            url: dataPath + ".2.json",
            cache: false
        }).done(handler);

        function handler(mfData){
            multifield.items.getAll().forEach(function(item, i) {
                var $mfItem = $(item),
                    $radio = $mfItem.find('[type="radio"]');

                var itemName = getJustMFItemName($radio.attr("name")),
                    radioName = $radio.attr("name");

                radioName = radioName.substring(radioName.lastIndexOf("/") + 1);

                if(_.isEmpty(mfData[itemName]) || _.isEmpty((mfData[itemName][radioName]))){
                    return;
                }

                $radio.filter("[value='" + mfData[itemName][radioName] + "']").prop("checked", "true");
            });
        }

        function getJustMFItemName(itemName){
            itemName = itemName.substr(itemName.indexOf(mfName) + mfName.length + 1);

            itemName = itemName.substring(0, itemName.indexOf("/"));

            return itemName;
        }
    }

    function getStringAfterLastSlash(str){
        if(!str || (str.indexOf("/") == -1)){
            return "";
        }

        return str.substr(str.lastIndexOf("/") + 1);
    }
}(jQuery, jQuery(document), Granite.author));