(function () {
    if (typeof EAEM == "undefined") {
        EAEM = {};
    }

    EAEM.getDocName = function(){
        try {
            return app.activeDocument.name;
        } catch(err) {}
    }
})();