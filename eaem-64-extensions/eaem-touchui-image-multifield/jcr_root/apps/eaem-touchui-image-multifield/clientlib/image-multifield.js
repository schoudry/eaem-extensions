(function ($, $document) {
    var COMPOSITE_MULTIFIELD_SELECTOR = "coral-multifield[data-granite-coral-multifield-composite]",
        FILE_REFERENCE_PARAM = "fileReference",
        registry = $(window).adaptTo("foundation-registry"),
        ALLOWED_MIME_TYPE = "image/jpeg",
        adapters = registry.get("foundation.adapters");

    var fuAdapter = _.reject(adapters, function(adapter){
        return ((adapter.type !== "foundation-field") || (adapter.selector !== "coral-fileupload.cq-FileUpload"));
    });

    if(_.isEmpty(fuAdapter)){
        return;
    }

    fuAdapter = fuAdapter[0];

    var orignFn = fuAdapter.adapter;

    fuAdapter.adapter = function(el) {
        return Object.assign(orignFn.call(el), {
            getName: function () {
                return el.name;
            },
            setName: function(name) {
                var prefix = name.substr(0, name.lastIndexOf(el.name));

                el.name = name;

                $("input[type='hidden'][data-cq-fileupload-parameter]", el).each(function(i, el) {
                    if ($(el).data("data-cq-fileupload-parameter") !== "filemovefrom") {
                        this.setAttribute("name", prefix + this.getAttribute("name"));
                    }
                });
            }
        });
    };

    $document.on("foundation-contentloaded", function(e) {
        var composites = $(COMPOSITE_MULTIFIELD_SELECTOR, e.target);

        composites.each(function() {
            Coral.commons.ready(this, function(el) {
                addThumbnails(el);
            });
        });
    });

    function addThumbnails(multifield){
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
                    $fileUpload = $mfItem.find("coral-fileupload");

                if(_.isEmpty($fileUpload)){
                    return;
                }

                var itemName = getJustItemName($fileUpload.attr("name"));

                if(_.isEmpty(mfData[itemName]) || _.isEmpty((mfData[itemName][FILE_REFERENCE_PARAM]))){
                    return;
                }

                var imagePath = mfData[itemName][FILE_REFERENCE_PARAM];

                $fileUpload.trigger($.Event("assetselected", {
                    path: imagePath,
                    group: "",
                    mimetype: ALLOWED_MIME_TYPE, // workaround to add thumbnail
                    param: "",
                    thumbnail: getThumbnailHtml(imagePath)
                }));
            });
        }

        function getThumbnailHtml(path){
            return "<img class='cq-dd-image' src='" + path + "/_jcr_content/renditions/cq5dam.thumbnail.319.319.png'>";
        }

        function getJustItemName(itemName){
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
}(jQuery, jQuery(document)));