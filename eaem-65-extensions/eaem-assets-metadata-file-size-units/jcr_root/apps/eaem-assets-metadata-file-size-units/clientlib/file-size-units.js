(function($, $document) {
    var FILE_SIZE_NAME = "./jcr:content/metadata/dam:size",
        initialized = false;

    $document.on("foundation-contentloaded", init);

    function init(){
        if(initialized){
            return;
        }

        initialized = true;

        convertFileSize();
    }

    function convertFileSize(){
        var $damSize = $("[name='" + FILE_SIZE_NAME + "']");

        if(_.isEmpty($damSize)){
            return;
        }

        var sizeInBytes = $damSize.val();

        $damSize.val(!sizeInBytes ?  "Unavailable" : formatBytes(parseInt(sizeInBytes), 2));
    }

    function formatBytes(bytes, decimals) {
        if (bytes === 0){
            return '0 Bytes';
        }

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}(jQuery, jQuery(document)));