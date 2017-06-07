(function ($, $document) {
    var EAEM_MODE = "eaemMode", pageLoaded = false;

    $document.on("cq-page-info-loaded", loadDesiredLayer);

    function loadDesiredLayer(){
        if(pageLoaded){
            return;
        }

        pageLoaded = true;

        var layerManager = Granite.author.layerManager,
            queryParams = queryParameters(),
            eaemMode = queryParams[EAEM_MODE],
            currentLayerName = layerManager.getCurrentLayerName();

        if(_.isEmpty(eaemMode) || _.isEmpty(currentLayerName)
                    || (currentLayerName.toLowerCase() === eaemMode.toLowerCase())) {
            return;
        }

        layerManager.activateLayer(eaemMode);
    }

    function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }
}(jQuery, jQuery(document)));