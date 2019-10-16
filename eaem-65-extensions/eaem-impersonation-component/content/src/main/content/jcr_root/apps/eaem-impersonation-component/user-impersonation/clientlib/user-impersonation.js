(function(){
	window.EAEM_IMPERSONATION = {
		impersonateAsUser: function(userId){
			document.cookie = "sling.sudo=" + userId + "; path=/";
			location.reload();
		},

		revertToSelf: function(){
			document.cookie = "sling.sudo=; path=/;";
			location.reload();
		},

		checkImpersonated: function(){
			var cookies = document.cookie;

			if(cookies && (cookies.indexOf("sling.sudo") != -1)){
				var user = cookies.match('(^|;) ?' + 'sling.sudo' + '=([^;]*)(;|$)');

				$("#eaem-impersonate").hide();

				$("#eaem-impersonate-user").html(user ? user[2] : "");
				$("#eaem-impersonate-revert").show();
			}
		}
	};

	EAEM_IMPERSONATION.checkImpersonated();
}());
