(function (document, $, assetFinder) {
    // class assetfinder-content-container is defined in
    // libs/wcm/core/content/editor/jcr:content/sidepanels/edit/items/assetsTab/items/contentPanel/items/assetfinder
    var aContainer = assetFinder.$el.find('.assetfinder-content-container');

    // id assetfinder-filter and class assetfilter.type are defined in
    // libs/wcm/core/content/editor/jcr:content/sidepanels/edit/items/assetsTab/items/filterPanel/items/views/items/search/items/searchpanel
    var $assetFinderFilter = $('#assetfinder-filter');
    var $assetFinderType = $assetFinderFilter.find(".assetfilter.type");

    var showMeta = { "dam:FileFormat": "File format", "dam:MIMEtype": "Mime type",
                        "dam:size": "Size in bytes", "jcr:lastModified": "Last Modified",
                        "tiff:ImageLength": "Length", "tiff:ImageWidth": "Width" };

    var c$cardView = CUI.CardView.get(aContainer);

    c$cardView.$element.on("change:insertitem", function (event) {
        if (event.moreItems) {
            return;
        }

        var type = $assetFinderType.find("select").find("option:selected").val();

        if (type !== "Images") {
            return;
        }

        var $cards = $(event.target).find(".card-asset");

        $.each($cards, function (i, card) {
            addToolTip(card);
        });
    });

    var addToolTip = function (card) {
        var $card = $(card), nodeValue = "";

        var addHtml = function (key, value) {
            return "<div style='display: block;'>" +
                        "<span style='font-family:adobe-clean; font-weight: bold'>" + key + "</span>: "
                        + value +
                    "</div>";
        };

        $.ajax({
            url: $card.data("path") + "/jcr:content/metadata.json",
            dataType: "json"
        }).done(function (data) {
            nodeValue = addHtml("Name", $card.find("h4").text());

            for (var x in data) {
                if (!data.hasOwnProperty(x) || !showMeta.hasOwnProperty(x)) {
                    continue;
                }

                if (data[x]) {
                    nodeValue = nodeValue + addHtml(showMeta[x], data[x]);
                }
            }

            nodeValue = nodeValue + "</div>";

            $card.mouseenter(function () {
                var tooltip = new CUI.Tooltip({
                    type: "info",
                    target: $(card),
                    content: nodeValue,
                    arrow: "bottom",
                    interactive: true
                });
            });
        });
    }
}(document, jQuery, Granite.author.ui.assetFinder));