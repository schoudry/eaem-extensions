(function ($, $document) {
    const RICH_TEXT_EDITABLE_SELECTOR = ".cq-RichText-editable",
            DATA_RTE_INSTANCE = "rteinstance";

    $document.on("foundation-contentloaded", function(e){
        const $richTextDiv = $(e.target).find(RICH_TEXT_EDITABLE_SELECTOR);

        $richTextDiv.each(function() {
            $(this).on("editing-start", function() {
                const $this = $(this),
                    rte = $this.data(DATA_RTE_INSTANCE),
                    ek = rte.editorKernel;

                extendLinkCommand(ek.registeredCommands._link);
            })
        });
    });

    function extendLinkCommand(_linkCmd){
        const origAddLinkToDomFn = _linkCmd.addLinkToDom;

        _linkCmd.addLinkToDom = function(execDef){
            origAddLinkToDomFn.call(this, execDef);

            const context = execDef.editContext,
                path = execDef.value.url;

            if(path.endsWith(".pdf")){
                addIconHTML(context, getPDFIconHTML());
            }else if(path.endsWith(".docx")){
                addIconHTML(context, getWordIconHTML());
            }else{
                addIconHTML(context, getFileIconHTML());
            }
        }

        function addIconHTML(context, iconHTML){
            let range = CUI.rte.Selection.getLeadRange(context);

            let tempDiv = context.doc.createElement("div");
            tempDiv.innerHTML = iconHTML;

            let textFrag = context.doc.createDocumentFragment();
            let firstNode, lastNode;

            while ((firstNode = tempDiv.firstChild)) {
                lastNode = textFrag.appendChild(firstNode);
            }

            range.deleteContents();
            range.insertNode(textFrag);
            range.setStartAfter(lastNode);
        }

        function getPDFIconHTML(){
            return '<span style="color: red"> (pdf)</span>';
        }

        function getWordIconHTML(){
            return '<span style="color: red"> (word)</span>';
        }

        function getFileIconHTML(){
            return '<span style="color: red"> (document)</span>';
        }
    }

}(jQuery, jQuery(document)));