"use strict";

use( ["/libs/wcm/foundation/components/utils/ResourceUtils.js" ], function(ResourceUtils){
    var images = {}, properties = granite.resource.properties,
        artistsPath = granite.resource.path + "/artists", counter = 1, artist;

    images.gallery = properties["gallery"];
    images.artists = undefined;

    function recursiveImageRead(path){
        ResourceUtils.getResource(path)
                        .then(addImage);
    }

    function addImage(artistRes){
        if(!images.artists){
            images.artists = [];
        }

        properties = artistRes.properties;

        artist = {
            painting: properties["paintingRef"],
            desc: properties["desc"],
            name: properties["artist"]
        };

        images.artists.push(artist);

        recursiveImageRead(artistsPath + "/" + counter++);
    }

    recursiveImageRead(artistsPath + "/" + counter++);

    return images;
} );