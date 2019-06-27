(function ($, $document, author) {
    var self = {},
        EAEM_APPROVED = 'Images - Approved';

    var searchPath = self.searchRoot = "/content/dam",
        imageServlet = '/bin/wcm/contentfinder/asset/view.html',
        itemResourceType = 'cq/gui/components/authoring/assetfinder/asset';

    self.loadAssets = function (query, lowerLimit, upperLimit) {
        query = query.concat("\"jcr:content/metadata/dam:status\": \"approved\" ");
        query = query.concat("order:\"-jcr:content/jcr:lastModified\" ");

        var param = {
            '_dc': new Date().getTime(),
            'query': query.concat("order:\"-jcr:content/jcr:lastModified\" "),
            'mimeType': 'image,application/x-ImageSet,application/x-SpinSet,application/x-MixedMediaSet,application/x-CarouselSet',
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

    author.ui.assetFinder.register(EAEM_APPROVED, self);
}(jQuery, jQuery(document), Granite.author));