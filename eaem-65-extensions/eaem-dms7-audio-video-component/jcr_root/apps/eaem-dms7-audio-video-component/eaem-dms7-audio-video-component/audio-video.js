use( function(){
    var METADATA_NODE = com.day.cq.dam.api.s7dam.constants.S7damConstants.S7_ASSET_METADATA_NODE,
        SCENE7_FODLER = METADATA_NODE + "/metadata/dam:scene7Folder",
        SCENE7_DOMAIN = METADATA_NODE + "/metadata/dam:scene7Domain",
        fileReference = properties['./fileReference'],
        rootNode = currentSession.rootNode,
        mediaInfo = {};

    if(!fileReference) {
        mediaInfo.isAudio = false;
        return;
    }

    var assetNode = rootNode.getNode(fileReference.substring(1)),
        publishUrl = getPublishServerURL(assetNode);

    //log.info("publishUrl----------" + publishUrl);

    return{
        isAudio: isAudioFile(assetNode),
        assetName: assetNode.getName(),
        s7PublishPath: publishUrl,
        bgImage: assetNode.getPath() + "/jcr:content/renditions/poster.png"
    };

    function isAudioFile(assetNode){
        var META_DC_FORMAT = "jcr:content/metadata/dc:format",
            isAudioFile = false;

        if(assetNode == undefined){
            return isAudioFile;
        }

        if( assetNode.hasProperty(META_DC_FORMAT)) {
            var dcFormat = assetNode.getProperty(META_DC_FORMAT).getString();
            isAudioFile = dcFormat.startsWith("audio");
        }

        return isAudioFile;
    }

    function getPublishServerURL(assetNode) {
        var s7Path = assetNode.getProperty(SCENE7_DOMAIN).getString() + "is/content/"
                        + assetNode.getProperty(SCENE7_FODLER).getString() + assetNode.getName();

        return s7Path;
    }
});

