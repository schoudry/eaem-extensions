(function ($, $document) {
    var BUTTON_URL = "/apps/eaem-assets-send-mail/content/send-mail-but.html",
        SHARE_ACTIVATOR = "cq-damadmin-admin-actions-adhocassetshare-activator",
        SEND_MAIL_URL = "/apps/eaem-assets-send-mail/send-mail-dialog.html",
        CANCEL_CSS = "[data-foundation-wizard-control-action='cancel']",
        SENDER = "experience-aem", REQUESTER = "requester", $mailModal,
        url = document.location.pathname;

    if( url.indexOf("/assets.html") == 0 ){
        $document.on("foundation-selections-change", addSendMail);
    }else if(url.indexOf(SEND_MAIL_URL) == 0){
        handleSendMailDialog();
    }

    function handleSendMailDialog(){
        $document.on("foundation-contentloaded", fillDefaultValues);

        $document.on("click", CANCEL_CSS, sendCancelMessage);

        $document.submit(postEmailContent);
    }

    function postEmailContent(){

    }

    function sendCancelMessage(){
        var message = {
            sender: SENDER,
            action: "cancel"
        };

        getParent().postMessage(JSON.stringify(message), "*");
    }

    function getParent() {
        if (window.opener) {
            return window.opener;
        }

        return parent;
    }

    function closeModal(event){
        event = event.originalEvent || {};

        if (_.isEmpty(event.data) || _.isEmpty($mailModal)) {
            return;
        }

        var message, action;

        try{
            message = JSON.parse(event.data);
        }catch(err){
            return;
        }

        if (!message || message.sender !== SENDER) {
            return;
        }

        var modal = $mailModal.data('modal');
        modal.hide();
        modal.$element.remove();
    }

    function fillDefaultValues(){
        var queryParams = queryParameters(),
            form = $("form")[0];

        setWidgetValue(form, "[name='./subject']", queryParams.subject);

        setWidgetValue(form, "[name='./body']", queryParams.body);
    }

    function setWidgetValue(form, selector, value){
        Coral.commons.ready(form.querySelector(selector), function (field) {
            field.value = _.isEmpty(value) ? "" : decodeURIComponent(value);
        });
    }

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

    function addSendMail(){
        $.ajax(BUTTON_URL).done(addButton);
    }

    function addButton(html) {
        var $eActivator = $("." + SHARE_ACTIVATOR);

        if ($eActivator.length == 0) {
            return;
        }

        var $mail = $(html).css("margin-left", "20px").insertBefore($eActivator);

        $mail.click(openModal);

        $(window).off('message', closeModal).on('message', closeModal);
    }

    function openModal(){
        var actionConfig = ($(this)).data("foundationCollectionAction");

        var $items = $(".foundation-selections-item"),
            assetPaths = [];

        $items.each(function () {
            assetPaths.push($(this).data("foundationCollectionItemId"));
        });

        var body = "Please review the following assets... \n\n" + assetPaths.join("\n");

        showMailModal(getModalIFrameUrl("Review Assets...", body));
    }

    function showMailModal(url){
        var $iframe = $('<iframe>'),
            $modal = $('<div>').addClass('eaem-send-mail-apply-modal coral-Modal');

        $iframe.attr('src', url).appendTo($modal);

        $modal.appendTo('body').modal({
            type: 'default',
            buttons: [],
            visible: true
        });

        $mailModal = $modal;
    }

    function getModalIFrameUrl(subject, body){
        var url = Granite.HTTP.externalize(SEND_MAIL_URL) + "?" + REQUESTER + "=" + SENDER;

        url = url + "&subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

        return url;
    }
}(jQuery, jQuery(document)));