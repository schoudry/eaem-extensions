use( function(){
    var fileReference = properties['./fileReference'],
        rootNode = currentSession.rootNode,
        assetNode;

    log.info("fileReference----------" + fileReference);

    if(fileReference != undefined){
        assetNode = rootNode.getNode(fileReference.substring(1));
    }

    return{
        isAudio: isAudioFile(assetNode)
    }
});

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