(function ($, $document) {
    const url = document.location.pathname;

    if( !isCFEditor() ){
        return;
    }

    alert("hello");

    function isCFEditor(){
        return ((url.indexOf("/editor.html") == 0)
            ||  (url.indexOf("/mnt/overlay/dam/cfm/admin/content/v2/fragment-editor.html") == 0) )
    }
}(jQuery, jQuery(document)));