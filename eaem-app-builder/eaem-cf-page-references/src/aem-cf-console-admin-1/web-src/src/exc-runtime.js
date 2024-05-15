/*
* <license header>
*/

/**
 *
 * Script to load the Adobe Experience Cloud Runtime.
 *
 * @throws {Error} error in case of failure, most likely when the app is not running in
 * the Experience Cloud Shell.
 *
 */
/* eslint-disable-next-line */
(function(e,t){if(t.location===t.parent.location)throw new Error("Module Runtime: Needs to be within an iframe!");var o=function(e){var t=new URL(e.location.href).searchParams.get("_mr");return t||!e.EXC_US_HMR?t:e.sessionStorage.getItem("unifiedShellMRScript")}(t);if(!o)throw new Error("Module Runtime: Missing script!");if("https:"!==(o=new URL(decodeURIComponent(o))).protocol)throw new Error("Module Runtime: Must be HTTPS!");if(!/^(exc-unifiedcontent\.)?experience(-qa|-stage|-cdn|-cdn-stage)?\.adobe\.(com|net)$/.test(o.hostname)&&!/localhost\.corp\.adobe\.com$/.test(o.hostname))throw new Error("Module Runtime: Invalid domain!");if(!/\.js$/.test(o.pathname))throw new Error("Module Runtime: Must be a JavaScript file!");t.EXC_US_HMR&&t.sessionStorage.setItem("unifiedShellMRScript",o.toString());var n=e.createElement("script");n.async=1,n.src=o.toString(),n.onload=n.onreadystatechange=function(){n.readyState&&!/loaded|complete/.test(n.readyState)||(n.onload=n.onreadystatechange=null,n=void 0,"EXC_MR_READY"in t&&t.EXC_MR_READY())},e.head.appendChild(n)})(document,window);
