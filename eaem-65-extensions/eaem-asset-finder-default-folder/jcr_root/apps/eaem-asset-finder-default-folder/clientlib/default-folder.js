(function ($, $document, author) {
    var self = {},
        IMAGES_FINDER = "Images",
        PATH_FIELD = "foundation-autocomplete[name='assetfilter_image_path']",
        DEFAULT_FOLDER = '/content/dam/we-retail';

    var searchPath = self.searchRoot,
        imageServlet = '/bin/wcm/contentfinder/asset/view.html',
        itemResourceType = 'cq/gui/components/authoring/assetfinder/asset';

    self.loadAssets = function (query, lowerLimit, upperLimit) {
        if(_.isEmpty(searchPath)){
            searchPath = DEFAULT_FOLDER;
            $(PATH_FIELD)[0]._input.value = DEFAULT_FOLDER;
        }

        var param = {
            '_dc': new Date().getTime(),
            'query': query.concat("order:\"-jcr:content/jcr:lastModified\" "),
            'mimeType': 'image',
            'itemResourceType': itemResourceType,
            'limit': lowerLimit + ".." + upperLimit,
            '_charset_': 'utf-8'
        };

        return $.ajax({
            type: 'GET',
            dataType: 'html',
            url: Granite.HTTP.externalize(imageServlet) + searchPath,
            data: param
        });
    };

    self.setSearchPath = function (spath) {
        searchPath = spath;
    };

    author.ui.assetFinder.register(IMAGES_FINDER, self);
}(jQuery, jQuery(document), Granite.author));
