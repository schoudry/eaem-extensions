(function ($) {
    "use strict";

    var _ = window._,
        Class = window.Class,
        GROUP = "experience-aem",
        CSS_DIALOG = "/apps/eaem-touch-rte-list-plugin-css/dialog/cq:dialog.html",
        CUI = window.CUI;

    var EAEMCSSListCmd = new Class({
        extend: CUI.rte.commands.List,

        toString: "EAEMCSSListCmd",

        execute: function(execDef) {
            this.superClass.execute.call(this, execDef);

            var list = this.getDefiningListDom(execDef.editContext, execDef.nodeList);

            if(!list){
                return;
            }

            registerReceiveDataListener(receiveMessage);

            if(!this.eaemSelectCssDialog){
                this.eaemSelectCssDialog = showDialog();
            }

            var eaemSelectCssDialog = this.eaemSelectCssDialog;

            eaemSelectCssDialog.show();

            function receiveMessage(event) {
                if (_.isEmpty(event.data)) {
                    return;
                }

                var message = JSON.parse(event.data);

                if (!message || message.sender !== GROUP) {
                    return;
                }

                $(list).addClass(message.data.cssClass);

                eaemSelectCssDialog.hide();

                removeReceiveDataListener(receiveMessage);
            }
        }
    });

    function showDialog(){
        var html = "<iframe width='540px' height='250px' frameBorder='0' src='"
                        + CSS_DIALOG + "?requester=" + GROUP + "'>"
                    + "</iframe>";

        var cuiDialog = new Coral.Dialog().set({
            backdrop: 'static',
            header: {
                innerHTML: 'Select css class'
            },
            content: {
                innerHTML: html
            }
        });

        document.body.appendChild(cuiDialog);

        return cuiDialog;
    }

    function removeReceiveDataListener(handler) {
        if (window.removeEventListener) {
            window.removeEventListener("message", handler);
        } else if (window.detachEvent) {
            window.detachEvent("onmessage", handler);
        }
    }

    function registerReceiveDataListener(handler) {
        if (window.addEventListener) {
            window.addEventListener("message", handler, false);
        } else if (window.attachEvent) {
            window.attachEvent("onmessage", handler);
        }
    }

    CUI.rte.commands.CommandRegistry.register("_list", EAEMCSSListCmd);
})(jQuery);

(function($, $document){
    var SENDER = "experience-aem",
        REQUESTER = "requester",
        CSS_CLASS = "cssClass";

    if(queryParameters()[REQUESTER] !== SENDER ){
        return;
    }

    $document.on("foundation-contentloaded", stylePopoverIframe);

    function queryParameters() {
        var result = {}, param,
            params = document.location.search.split(/\?|\&/);

        params.forEach( function(it) {
            if (_.isEmpty(it)) {
                return;
            }

            param = it.split("=");
            result[param[0]] = param[1];
        });

        return result;
    }

    function stylePopoverIframe(){
        var $dialog = $(".cq-dialog").css("background", "white"),
            $selectBut = $dialog.find(".coral-Button--primary");

        $dialog.find(".cq-dialog-header").hide();
        $dialog.find(".cq-dialog-content").css("top", ".1rem");

        $selectBut.css("margin", "120px 0 0 380px").click(sendDataMessage);
    }

    function sendDataMessage(){
        var message = {
            sender: SENDER,
            data: {}
        }, $dialog, cssClass;

        $dialog = $(".cq-dialog");

        cssClass = $dialog.find("[name='./" + CSS_CLASS + "']").val();

        message.data[CSS_CLASS] = cssClass;

        parent.postMessage(JSON.stringify(message), "*");
    }
})(jQuery, jQuery(document));