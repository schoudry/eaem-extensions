(function ($, author) {
    "use strict";

    if (typeof window.ExperienceAEM == "undefined") {
        window.ExperienceAEM = {};
    }

    ExperienceAEM.open = open;

    function open(editable, param, target){
        //Granite.author.store contains editables added on page;
        author.DialogFrame.openDialog(editable);
    }
})($, Granite.author);
