(function($, $document) {
	var DAM_CREATE_FOLDER = "#dam-create-folder",
		CREATE_FOLDER_DIALOG = "#createfolder",
		ORDERABLE_SEL = "coral-checkbox:last";

	$document.on("foundation-contentloaded", onUILoad);

	function onUILoad(){
		Coral.commons.ready($(DAM_CREATE_FOLDER), function(){
			$(DAM_CREATE_FOLDER).click(makeOrderableDefault);
		});
	}

	function makeOrderableDefault(event){
		var $orderable = $(CREATE_FOLDER_DIALOG).find(ORDERABLE_SEL);

		if(_.isEmpty($orderable)){
			return;
		}

		$orderable[0].checked = false;

		$orderable.click();
	}

})(jQuery, jQuery(document));