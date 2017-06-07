(function () {
    var oneTime = false;

    Granite.UI.MovePageWizard.prototype.getDestinationPath = function() {
        if(oneTime){
            return this.destinationPath;
        }

        oneTime = true;

        this.destinationPath = getStringBeforeLastSlash(decodeURIComponent(queryParameters()["item"]));

        return this.destinationPath;
    };

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

    function getStringBeforeLastSlash(str){
        if(!str){
            return str;
        }

        return str.substring(0,str.lastIndexOf("/"));
    }
}());