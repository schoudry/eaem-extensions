(function () {
    function changeNavColorCRXDELite(switcher) {
        var message = "!!! CAUTION PUBLISH !!!";

        var inner = switcher.firstChild;

        inner.style.background = "#FFFF33";

        var publishText = '<span style="font-size:30px; font-weight: bold; color:red; margin-left: 700px">' + message + '</span>';

        inner.insertAdjacentHTML('beforeend', publishText);
    }

    Ext.onReady(function () {
        var INTERVAL = setInterval(function () {
            var switcher = document.getElementsByClassName("crx-switcher");

            if (switcher.length > 0) {
                clearInterval(INTERVAL);
                changeNavColorCRXDELite(switcher[0]);
            }
        }, 250);
    });
}())

