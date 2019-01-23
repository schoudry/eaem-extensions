(function ($, $document) {
    $document.on("coral-cyclebutton:change", ".granite-toggleable-control", handlePathFieldPicker);

    function handlePathFieldPicker(){
        alert("hi");
    }
}(jQuery, jQuery(document)));