use( function(){
    var fileReference = properties['./fileReference'],
        rootNode = currentSession.rootNode,
        assetNode = rootNode.getNode(fileReference.substring(1));

    return{
        isAudio: isAudioFile(assetNode)
    }
});

function isAudioFile(assetNode){
    var META_DC_FORMAT = "jcr:content/metadata/dc:format",
        isAudioFile = false;

    if( assetNode.hasProperty(META_DC_FORMAT)) {
        var dcFormat = assetNode.getProperty(META_DC_FORMAT).getString();
        isAudioFile = dcFormat.startsWith("audio");
    }

    return isAudioFile;
}