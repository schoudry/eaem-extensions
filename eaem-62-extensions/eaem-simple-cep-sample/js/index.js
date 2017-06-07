'use strict';

(function () {
    var csInterface = new CSInterface();

    csInterface.addEventListener("documentAfterActivate", documentActivated);

    function documentActivated(){
        callExtendScript("EAEM.getDocName",function(name){
            alert("Experience AEM Sample Panel - Document Open - '" + name + "'");
        });

        /*csInterface.evalScript("EAEM.getDocName()", function(name){
            alert("Experience AEM Sample Panel - Document Opened - '" + name + "'");
        });*/
    }

    function callExtendScript(method){
        var args = [].splice.call(arguments, 1);
        var callback = undefined;
        var params = [];

        function escapeArgument(arg) {
            return arg.replace(/\r\n?|\n/g, "\\n").replace(/"/g, '\\\"');
        }

        for (var idx in args) {
            var arg = args[idx];

            if (typeof(arg) == 'function') {
                callback = arg;
            } else {
                params.push(escapeArgument(arg));
            }
        }

        var functionArgs = params.length ? '("' + params.join('","') + '")' : '()',
            script = method + functionArgs;

        csInterface.evalScript(script, callback);
    }
}());


