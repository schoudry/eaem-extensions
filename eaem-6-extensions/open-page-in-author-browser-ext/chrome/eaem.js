(function(){
    var authorPrefix = 'http://localhost:4502';

    chrome.browserAction.onClicked.addListener(function(tab) {
        chrome.tabs.getSelected(null, function(tab){
            var parser = document.createElement('a');
            parser.href = tab.url;

            var path = "";

            if(parser.pathname.indexOf("/cf") == 0){
                path = parser.pathname + parser.hash + parser.search;
            }else{
                path = "/cf#" + parser.pathname + parser.search;
            }

            path = authorPrefix + path;

            chrome.tabs.create({url : path});
        });
    });
})();
