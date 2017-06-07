if ("undefined" == typeof(ExperienceAEM)) {
    var ExperienceAEM = {};
};

ExperienceAEM.AccessAndEditing = {
    init : function () {
        var navbar = document.getElementById("nav-bar");
        var newset = navbar.currentSet + ',eaem-navbar-button';
        navbar.currentSet = newset;
        navbar.setAttribute("currentset", newset );
        document.persist("nav-bar", "currentset");
    },

    open: function(aEvent) {
        var bundle = document.getElementById("eaem-string-bundle");

        if(!bundle){
            window.alert("Missing 'eaem.properties'");
            return;
        }

        var hostPrefix = bundle.getString("author.prefix");

        if(!hostPrefix){
            window.alert("Missing author prefix 'author.prefix' in 'eaem.properties'");
            return;
        }

        var loc = window.content.location;
        var path = "";

        if(loc.pathname.indexOf("/cf") == 0){
            path = loc.pathname + loc.hash + loc.search;
        }else{
            path = "/cf#" + loc.pathname + loc.search;
        }

        window.BrowserOpenTab();
        window.content.location.href = hostPrefix + path;
    }
};

window.addEventListener("load", function(){ ExperienceAEM.AccessAndEditing.init();  }, false);
