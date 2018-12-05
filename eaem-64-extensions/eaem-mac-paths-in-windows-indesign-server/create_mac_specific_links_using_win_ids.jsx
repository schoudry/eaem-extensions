(function () {
    var TEST_FILE = "C:/dev/projects/files/test.indd",
        IMAGE_FILE = "C:/Users/nalabotu/Pictures/placeholder.jpg";
    
    function addImageInPage(){
        var doc = app.documents.add(),
            rectangle = doc.rectangles.add();

        rectangle.geometricBounds = [10,10,30,30];
        rectangle.frameFittingOptions.autoFit = true;

        try{
            //add a placeholder image
            rectangle.place(IMAGE_FILE);
        }catch(err){
            $.writeln(err);
        }

        var links = doc.links,
            PATH_EXISTS_IN_MAC_NOT_WINDOWS = "file:///Users/nalabotu/dev/temp/exists_in_mac_not_windows.jpeg";

        for(var i = 0; i < links.length; i++ ){
            var link = links[0];

            try{
                //link.relink(new File(PATH_EXISTS_IN_MAC_NOT_WINDOWS));

                // relink to a file that exists in mac, the doc is opened, but not windows where the doc was created
                link.reinitLink(PATH_EXISTS_IN_MAC_NOT_WINDOWS);
            }catch(err){
                $.writeln(err);
                return;
            }
        }

        doc.save(new File(TEST_FILE));

        doc.close();
    }
}());