//  json2.js
//  2016-10-28
//  Public Domain.
//  NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
//  See http://www.JSON.org/js.html
//  This code should be minified before deployment.
//  See http://javascript.crockford.com/jsmin.html

//  USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
//  NOT CONTROL.

//  This file creates a global JSON object containing two methods: stringify
//  and parse. This file provides the ES5 JSON capability to ES3 systems.
//  If a project might run on IE8 or earlier, then this file should be included.
//  This file does nothing on ES5 systems.

//      JSON.stringify(value, replacer, space)
//          value       any JavaScript value, usually an object or array.
//          replacer    an optional parameter that determines how object
//                      values are stringified for objects. It can be a
//                      function or an array of strings.
//          space       an optional parameter that specifies the indentation
//                      of nested structures. If it is omitted, the text will
//                      be packed without extra whitespace. If it is a number,
//                      it will specify the number of spaces to indent at each
//                      level. If it is a string (such as "\t" or "&nbsp;"),
//                      it contains the characters used to indent at each level.
//          This method produces a JSON text from a JavaScript value.
//          When an object value is found, if the object contains a toJSON
//          method, its toJSON method will be called and the result will be
//          stringified. A toJSON method does not serialize: it returns the
//          value represented by the name/value pair that should be serialized,
//          or undefined if nothing should be serialized. The toJSON method
//          will be passed the key associated with the value, and this will be
//          bound to the value.

//          For example, this would serialize Dates as ISO strings.

//              Date.prototype.toJSON = function (key) {
//                  function f(n) {
//                      // Format integers to have at least two digits.
//                      return (n < 10)
//                          ? "0" + n
//                          : n;
//                  }
//                  return this.getUTCFullYear()   + "-" +
//                       f(this.getUTCMonth() + 1) + "-" +
//                       f(this.getUTCDate())      + "T" +
//                       f(this.getUTCHours())     + ":" +
//                       f(this.getUTCMinutes())   + ":" +
//                       f(this.getUTCSeconds())   + "Z";
//              };

//          You can provide an optional replacer method. It will be passed the
//          key and value of each member, with this bound to the containing
//          object. The value that is returned from your method will be
//          serialized. If your method returns undefined, then the member will
//          be excluded from the serialization.

//          If the replacer parameter is an array of strings, then it will be
//          used to select the members to be serialized. It filters the results
//          such that only members with keys listed in the replacer array are
//          stringified.

//          Values that do not have JSON representations, such as undefined or
//          functions, will not be serialized. Such values in objects will be
//          dropped; in arrays they will be replaced with null. You can use
//          a replacer function to replace those with JSON values.

//          JSON.stringify(undefined) returns undefined.

//          The optional space parameter produces a stringification of the
//          value that is filled with line breaks and indentation to make it
//          easier to read.

//          If the space parameter is a non-empty string, then that string will
//          be used for indentation. If the space parameter is a number, then
//          the indentation will be that many spaces.

//          Example:

//          text = JSON.stringify(["e", {pluribus: "unum"}]);
//          // text is '["e",{"pluribus":"unum"}]'

//          text = JSON.stringify(["e", {pluribus: "unum"}], null, "\t");
//          // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

//          text = JSON.stringify([new Date()], function (key, value) {
//              return this[key] instanceof Date
//                  ? "Date(" + this[key] + ")"
//                  : value;
//          });
//          // text is '["Date(---current time---)"]'

//      JSON.parse(text, reviver)
//          This method parses a JSON text to produce an object or array.
//          It can throw a SyntaxError exception.

//          The optional reviver parameter is a function that can filter and
//          transform the results. It receives each of the keys and values,
//          and its return value is used instead of the original value.
//          If it returns what it received, then the structure is not modified.
//          If it returns undefined then the member is deleted.

//          Example:

//          // Parse the text. Values that look like ISO date strings will
//          // be converted to Date objects.

//          myData = JSON.parse(text, function (key, value) {
//              var a;
//              if (typeof value === "string") {
//                  a =
//   /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
//                  if (a) {
//                      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
//                          +a[5], +a[6]));
//                  }
//              }
//              return value;
//          });

//          myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
//              var d;
//              if (typeof value === "string" &&
//                      value.slice(0, 5) === "Date(" &&
//                      value.slice(-1) === ")") {
//                  d = new Date(value.slice(5, -1));
//                  if (d) {
//                      return d;
//                  }
//              }
//              return value;
//          });

//  This is a reference implementation. You are free to copy, modify, or
//  redistribute.

/*jslint
    eval, for, this
*/

/*property
    JSON, apply, call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== "object") {
    JSON = {};
}

(function () {
    "use strict";

    var rx_one = /^[\],:{}\s]*$/;
    var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
    var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
    var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
    var rx_escapable = /[\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10
            ? "0" + n
            : n;
    }

    function this_value() {
        return this.valueOf();
    }

    if (typeof Date.prototype.toJSON !== "function") {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + "-" +
                        f(this.getUTCMonth() + 1) + "-" +
                        f(this.getUTCDate()) + "T" +
                        f(this.getUTCHours()) + ":" +
                        f(this.getUTCMinutes()) + ":" +
                        f(this.getUTCSeconds()) + "Z"
                : null;
        };

        Boolean.prototype.toJSON = this_value;
        Number.prototype.toJSON = this_value;
        String.prototype.toJSON = this_value;
    }

    var gap;
    var indent;
    var meta;
    var rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        rx_escapable.lastIndex = 0;
        return rx_escapable.test(string)
            ? "\"" + string.replace(rx_escapable, function (a) {
                var c = meta[a];
                return typeof c === "string"
                    ? c
                    : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
            }) + "\""
            : "\"" + string + "\"";
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i;          // The loop counter.
        var k;          // The member key.
        var v;          // The member value.
        var length;
        var mind = gap;
        var partial;
        var value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === "object" &&
                typeof value.toJSON === "function") {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === "function") {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case "string":
            return quote(value);

        case "number":

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value)
                ? String(value)
                : "null";

        case "boolean":
        case "null":

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce "null". The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is "object", we might be dealing with an object or an array or
// null.

        case "object":

// Due to a specification blunder in ECMAScript, typeof null is "object",
// so watch out for that case.

            if (!value) {
                return "null";
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === "[object Array]") {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== "function") {
        meta = {    // table of character substitutions
            "\b": "\\b",
            "\t": "\\t",
            "\n": "\\n",
            "\f": "\\f",
            "\r": "\\r",
            "\"": "\\\"",
            "\\": "\\\\"
        };
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = "";
            indent = "";

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === "number") {
                for (i = 0; i < space; i += 1) {
                    indent += " ";
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === "string") {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== "function" &&
                    (typeof replacer !== "object" ||
                    typeof replacer.length !== "number")) {
                throw new Error("JSON.stringify");
            }

// Make a fake root object containing our value under the key of "".
// Return the result of stringifying the value.

            return str("", {"": value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== "function") {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k;
                var v;
                var value = holder[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            rx_dangerous.lastIndex = 0;
            if (rx_dangerous.test(text)) {
                text = text.replace(rx_dangerous, function (a) {
                    return "\\u" +
                            ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with "()" and "new"
// because they can cause invocation, and "=" because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with "@" (a non-JSON character). Second, we
// replace all simple value tokens with "]" characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or "]" or
// "," or ":" or "{" or "}". If that is so, then the text is safe for eval.

            if (
                rx_one.test(
                    text
                        .replace(rx_two, "@")
                        .replace(rx_three, "]")
                        .replace(rx_four, "")
                )
            ) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The "{" operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval("(" + text + ")");

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return (typeof reviver === "function")
                    ? walk({"": j}, "")
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError("JSON.parse");
        };
    }
}());
//==============================================================================
// HTTP get/post and some other helper methods
//==============================================================================


//==============================================================================
// Helper to encode/decode string to/from Base64
//==============================================================================
var Base64 = {

    // private property
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 
    // public method for encoding
    encode : function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;
 
        input = Base64._utf8_encode(input);
 
        while (i < input.length) {
 
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
 
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;
 
            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
 
            output = output +
            this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
            this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
        }
 
        return output;
    },
 
    // public method for decoding
    decode : function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
 
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 
        while (i < input.length) {
 
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));
 
            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;
 
            output = output + String.fromCharCode(chr1);
 
            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
 
        }
 
        output = Base64._utf8_decode(output);
 
        return output;
 
    },
 
    // private method for UTF-8 encoding
    _utf8_encode : function (string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";
 
        for (var n = 0; n < string.length; n++) {
 
            var c = string.charCodeAt(n);
 
            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
 
        }
 
        return utftext;
    },
 
    // private method for UTF-8 decoding
    _utf8_decode : function (utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
 
        while ( i < utftext.length ) {
 
            c = utftext.charCodeAt(i);
 
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
 
        }
 
        return string;
    }
 
}

//==============================================================================
// Utility function for loggin in via httpLinkConnectionmanager
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
//==============================================================================
function httpConnect(host, credentials) {
    if ('httpLinkConnectionManager' in app) {
        var decodedCredentials = Base64.decode(credentials);
        var credentialArray = decodedCredentials.split(":");
        var aemCredentials = '{"username":"' + credentialArray[0] + '","password":"' + credentialArray[1] + '"}';

        // transform host (get context path etc.)
        var transformedHost = transformHost(host);
        host = transformedHost.host

        var instance = "aem://" + host;
        try {
            $.writeln("connect to instance: "+instance);
            app.httpLinkConnectionManager.httpConnect(instance,aemCredentials);
        }
        catch (e) {
            $.writeln('ERROR: Unable to connect to instance ' + instance);
            $.writeln(''+e);
        }
    }
}

//==============================================================================
// Utility function for logout via httpLinkConnectionmanager
// param host - CQ host
//==============================================================================
function httpDisconnect(host) {
    if ('httpLinkConnectionManager' in app) {
        // transform host (get context path, add port 80 when not set etc.)
        var transformedHost = transformHost(host);
        host = transformedHost.host
        var instance = "aem://" + host;

        try {
            app.httpLinkConnectionManager.logout(instance);
        }
        catch (e) {
            $.writeln('ERROR: Unable to logout from instance ' + instance);
            $.writeln(''+e);
        }
    }
}


//==============================================================================
// helper to transform host into host, port and contextpath
// param host - the host to transform
// return object with host and contextpath
//==============================================================================
function transformHost(hostExpression) {
    var contextPath = "";
    var host = hostExpression;
    
    // remove contextPath
    idx = host.indexOf('/');
    if (idx > 0){
        contextPath = host.substring(idx);
        host = host.substring(0, idx);
    }
    return {
        contextPath : contextPath,
        host : host,
        protocol : "http://"
    }
}

//==============================================================================
// Fetch a JSON file from sling over http/basic auth by GET method
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param resource - URI to fetch
//==============================================================================
function fetchJSONObjectByGET(host, credentials, resource) {
    var connection = new Socket;

    // transform host (get context path, add port 80 when not set etc.)
    var transformedHost = transformHost(host);
    host = transformedHost.host;
    var contextPath = transformedHost.contextPath

    if (connection.open(host, 'UTF-8')) {
        var url = encodeURI(contextPath+resource);
        connection.write('GET ' + url + ' HTTP/1.0\n');
        connection.write('Authorization: Basic '+credentials + '\n');
        connection.write('\n');

        // skip header - Sling seems to always return proper headers
        // Works for now but needs to be improved
        var buffer = "";
        while (!connection.eof) {
            var ch = connection.read(1);
            if (ch.match("\n")) {
                if (buffer.length == 1) {
                    // start of message body
                    break;
                }
                buffer = "";
            } else {
                buffer = buffer + ch;
            }
        }
        connection.close();
        if(buffer === '') {
            throw 'No valid JSON response for host ' + host + ' and URL ' + url;
        }
        return JSON.parse(buffer);
    } else {
        throw 'Connection to host ' + host + ' could not be opened';
    }
}

//==============================================================================
// Do a sling post request
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param resource - URI for post
// param params - request parameters
//==============================================================================
function postReqParams(host, credentials, resource, params) {
    connection = new Socket;
    var contextPath = "";
    if (host.indexOf('/')>0){
        var idx = host.indexOf('/');
        contextPath = host.substring (idx);
        host = host.substring (0,idx);
    }
    var body='';
    for (var property in params) {
        if (params.hasOwnProperty(property)) {
         body = body +Base64._utf8_encode(property) + '='+ params[property]+'&';
        }
    }

    body = body + Base64._utf8_encode('_charset_')+'=utf-8'
    if (connection.open(host, 'UTF-8')) {

        var url = encodeURI(contextPath+resource);
        connection.write('POST ' + url + ' HTTP/1.0\n');
        connection.write('Authorization: Basic '+credentials + '\n');
        connection.write('Content-Type: application/x-www-form-urlencoded\n');
        connection.write('Content-Length: ' + body.length + '\n');
        connection.write('\n');
        connection.write(body + '\n');

        // skip header - Sling seems to always return proper headers
        // Works for now but needs to be improved
        var buffer = "";
        while (!connection.eof) {
            var ch = connection.read(1);
            if (ch.match("\n")) {
                if (buffer.length == 1) {
                    // start of message body
                    break;
                }
                buffer = "";
            } else {
                buffer = buffer + ch;
            }
        }
        connection.close();
        $.writeln("done");

    } else {
        throw 'Connection to host ' + host + ' could not be opened';
    }
}

//==============================================================================
// Fetch a JSON file from sling over http/basic auth by POST method
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param resource - URI to fetch
// param body - POST body
//==============================================================================
function fetchJSONObjectByPOST(host, credentials, resource, body) {
    var connection = new Socket;

    // transform host (get context path, add port 80 when not set etc.)
    var transformedHost = transformHost(host);
    host = transformedHost.host;
    var contextPath = transformedHost.contextPath

    if (connection.open(host, 'UTF-8')) {

        var url = encodeURI(contextPath+resource);
        connection.write('POST ' + url + ' HTTP/1.0\n');
        connection.write('Authorization: Basic '+credentials + '\n');
        connection.write('Content-Type: application/x-www-form-urlencoded\n');
        connection.write('Content-Length: ' + body.length + '\n');
        connection.write('\n');
        connection.write(body + '\n');

        // skip header - Sling seems to always return proper headers
        // Works for now but needs to be improved
        var buffer = "";
        while (!connection.eof) {
            var ch = connection.read(1);
            if (ch.match("\n")) {
                if (buffer.length == 1) {
                    // start of message body
                    break;
                }
                buffer = "";
            } else {
                buffer = buffer + ch;
            }
        }
        connection.close();
        if(buffer === '') {
            throw 'No valid JSON response for host ' + host + ' and URL ' + url;
        }
        return JSON.parse(buffer);
    } else {
        throw 'Connection to host ' + host + ' could not be opened';
    }
}

//==============================================================================
// Fetch a singe file from sling over http/basic auth
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param resource - URI to fetch
// param file - Target file to be created with the data fetched from the server
//==============================================================================
function fetchResource(host, credentials, resource, file) {
    var success = file.open ("w");
    file.encoding = "BINARY";
    var connection = new Socket;

	var success = false;
    var retries = 0;

    var status;

    while(!success && retries < 5) {

        // transform host (get context path, add port 80 when not set etc.)
        var transformedHost = transformHost(host);
        host = transformedHost.host;
        var contextPath = transformedHost.contextPath
    
        if (connection.open (host, "binary")) {
    
            // very basic request to fetch a single resource
            connection.write ("GET "+ encodeURI(contextPath+resource) +" HTTP/1.0");
            connection.write ("\n");
            connection.write ("Authorization: Basic "+credentials);
            connection.write ("\n\n");

            // Read through the HTTP headers
            // At this stage - the only one we care about is status (so we can detect a failure)
            // Works for now but needs to be improved
            var buffer = "";
            while (!connection.eof) {
                var ch = connection.read(1);
    
                if (ch.match("\n")) {
                    if (buffer.length == 1) {
                        // start of message body
                        break;
                    }
                    // status is first line - if we haven't seen status yet
                    // then this line contains it
                    if (status==null){
                         status = parseInt(buffer.split(' ')[1]);
                    }
    
                    buffer = "";
                } else {
                    buffer = buffer + ch;
                }
            }

            if(status==200){
                success = true;
            } else {
                 $.writeln('Seen error response '+status+' ['+retries+']');
            }

            // write message body
            while (!connection.eof) {
                file.write(connection.read());
            }
    
            connection.close();
            if (file.error != "") {
                $.writeln('Failed to open ' + file.error);
            }
    
            file.close();

            if(!success){
            	++retries;  
            }
        }
        else {
            file.close();
            throw 'Connection to host ' + host + ' could not be opened';
        }

    }

    if(!success) {
        throw ('Unable to download resource resource from AEM : ' + resource + " (" + status +")");
    }
}


//==============================================================================
// Put a singe file to sling over http/basic auth
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param file - Source file to send
// param fileName - file name to be created on the server
// param contentType - optional, used if set.
// param target - uri where to put this file
// param requestParams - key/value pair of request parameters to be sent
//==============================================================================
function putResource(host, credentials, file, fileName, contentType, target, requestParams) {
    // transform host (get context path, add port 80 when not set etc.)
    var transformedHost = transformHost(host);
    host = transformedHost.host;
    var contextPath = transformedHost.contextPath

	var success = false;
	var statusFromServer = 0;
    var retries = 0;

    while(!success && retries<5){
        file.open ("r");
        file.encoding = "BINARY";
        var boundary = '----------V2ymHFg03ehbqgZCaKO6jy';
        var connection = new Socket;
        if (connection.open (host, "binary")) {
            connection.write ("POST "+ encodeURI(contextPath+target) +" HTTP/1.0");
            connection.write ("\n");
            connection.write ("Authorization: Basic "+credentials);
            connection.write ("\n");
            connection.write ("User-Agent: Jakarta Commons-HttpClient/3.1");
            connection.write ("\n");
            connection.write ("Content-Type: multipart/form-data; boundary="+boundary);
            connection.write ("\n");
            var body = buildMultipartBody (boundary, file, fileName, contentType, requestParams);
            connection.write ("Content-Length: "+body.length);
            connection.write ("\r\n\r\n");
            //END of header
            connection.write (body);
    
            statusFromServer = readResponse(connection);

            if(statusFromServer>=400){
                $.writeln('Seen error response '+statusFromServer+' ['+retries+']');
            } else if (statusFromServer>=300) {
                $.writeln('Redirects currently not supported');
            } else if (statusFromServer>=200) {
                success=true;
            }

            if(!success){
            	++retries;  
            }
        } else {
            $.writeln('Connection to host ' + host + ' could not be opened');
        }
        file.close();
    }

	if(success){
    	addFilenameToManifest(target, fileName); 
    } else {
		$.writeln('Failed writing file '+fileName);
        throw ('Unable to upload resource to AEM : '+ fileName);
    }

}

function readStatus(connection){

	var statusLine = connection.readln();
    var statusCode = parseInt(statusLine.split(' ')[1]);

    return statusCode;
}

function readResponse(connection){

    var statusCode = readStatus(connection);

    var responseData = "";

    // Read rest of response body
    while (!connection.eof) {
        responseData+=connection.read();
    }

    connection.close();
    return statusCode;
}

function addFilesToManifest(remoteFolder, files) {

    for (var i=0; i<files.length; i++) {
        addFilenameToManifest(remoteFolder, files[i].fileName);
    }

}


function addFilenameToManifest(remoteFolder, filename){
	manifest = (typeof manifest === 'undefined') ? [] : manifest;

    if(filename!='manifest.txt'){

        var fname = filename;
        if(filename.indexOf('/')==0){
            fname = filename.substring(1);
        }
    
        var filePath = remoteFolder+'/'+fname;
        manifest.push(filePath);
    }

}

function postManifest(){

    var manifestFile = new File(exportFolder.fullName + "/manifest");
	$.writeln('Dumping manifest to '+manifestFile.fullName);
    manifestFile.encoding = 'UTF-8';
    manifestFile.open('w');
    
    for(var i=0; i<manifest.length; i++){
        manifestFile.writeln(manifest[i]);
    }
    
    manifestFile.close();
    $.writeln('Uploading manifest to '+target);
    putResource (host, credentials, manifestFile, 'manifest.txt', 'text/plain', target);
    $.writeln('Completed manifest upload');
    

}

function buildMultipartBody(boundary, file, fileName, contentType, requestParams) {
    var endBoundary = '\r\n--' + boundary + '--\r\n';
    var body;

    body = '--'+boundary+'\r\n';
    body = body + 'content-disposition: form-data; name="jcr:primaryType"';
    body = body + '\r\n\r\n';
    body = body + 'nt:unstructured';
    body = body + '\r\n';
    
	body = body + '--'+boundary+'\r\n';
            body = body + 'content-disposition: form-data; name="_charset_"';
            body = body + '\r\n\r\n';
            body = body + 'utf-8';
            body = body + '\r\n';
    
    // write other request parameters
    if (requestParams) {
        for (var key in requestParams) {
            body = body + '--'+boundary+'\r\n';
            body = body + 'content-disposition: form-data; name="'+ key +'"';
            body = body + '\r\n\r\n';
            body = body + requestParams[key];
            body = body + '\r\n';
        }
        //todo: FIX THIS: for now we just assume that its a request for a dam upload asset servlet
        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="file"; Filename="'+Base64._utf8_encode(fileName)+'"\r\n';
    } else {
        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="*"; Filename="'+Base64._utf8_encode(fileName)+'"\r\n';
    }

    if (contentType) {
        body = body + 'Content-Type: '+contentType+'\r\n';
    }
    // else, let sling determine the content type by file extension or body
    body = body + 'Content-Transfer-Encoding: binary\r\n';
    body = body + '\r\n';
    
    //write file contents
    var content;
    while ((content = file.read ()) != '') {
        body = body + content;
    }
    
    file.close();
    // todo: Sling doesnt seems to like it? or perhaps its a general error. 
    //body = body + '\r\n';

    body = body + endBoundary;
    return body;
}

//==============================================================================
// Put multiple files to sling over http/basic auth
// param host - CQ host
// param credentials - Basic Base64 encoded credentials
// param fileList - List of files to be sent
// param target - uri where to put this file
// param requestParams - key/value pair of request parameters to be sent
//==============================================================================
function putMultipleResource(host, credentials, fileList, target, requestParams) {
    
    var boundary = '----------V2ymHFg03ehbqgZCaKO6jy';
    var connection = new Socket;

    // transform host (get context path, add port 80 when not set etc.)
    transformedHost = transformHost(host);
    host = transformedHost.host;
    var contextPath = transformedHost.contextPath

    if (connection.open (host, "binary")) {
        connection.write ("POST "+ encodeURI(contextPath + target) +" HTTP/1.0");
        connection.write ("\n");
        connection.write ("Authorization: Basic "+credentials);
        connection.write ("\n");
        connection.write ("User-Agent: Jakarta Commons-HttpClient/3.1");
        connection.write ("\n");
        connection.write ("Content-Type: multipart/form-data; boundary="+boundary);
        connection.write ("\n");
        var body = buildMultiFileMultipartBody(boundary, fileList, requestParams);
        connection.write ("Content-Length: "+body.length);
        connection.write ("\r\n\r\n");
        //END of header
        connection.write (body);
        //Read responce before closing a connection
        // This is needed to make sure we do not return before sling writes the fine in to the repository.
        // write message body
        connection.read();
        while (!connection.eof) {
            connection.read();
        }
        connection.close();

        addFilesToManifest(target, fileList);
    }
    else {
        throw 'Connection to host ' + host + ' could not be opened';
    }
    delete connection;
}

function buildMultiFileMultipartBody(boundary, fileList, requestParams) {
    var endBoundary = '\r\n--' + boundary + '--\r\n';
    var body;

    body = '--'+boundary+'\r\n';
    body = body + 'content-disposition: form-data; name="jcr:primaryType"';
    body = body + '\r\n\r\n';
    body = body + 'nt:unstructured';
    body = body + '\r\n';
    
    body = body + '--'+boundary+'\r\n';
            body = body + 'content-disposition: form-data; name="_charset_"';
            body = body + '\r\n\r\n';
            body = body + 'utf-8';
            body = body + '\r\n';
    
    // write other request parameters
    if (requestParams) {
        for (var key in requestParams) {
            body = body + '--'+boundary+'\r\n';
            body = body + 'content-disposition: form-data; name="'+ key +'"';
            body = body + '\r\n\r\n';
            body = body + requestParams[key];
            body = body + '\r\n';
        }
    }
    for (var i=0; i<fileList.length; i++) {

          body = body + '--'+boundary+'\r\n';
          body = body + 'content-disposition: form-data; name="*"; Filename="'+Base64._utf8_encode(fileList[i].fileName)+'"\r\n';
          body = body + 'Content-Transfer-Encoding: binary\r\n';
          body = body + '\r\n';

          var success = fileList[i].file.open ("r");
          fileList[i].file.encoding = "BINARY";
          //write file contents
          var content;
          while ((content = fileList[i].file.read ()) != '') {
              body = body + content;
          }
          body = body + '\r\n';
          fileList[i].file.close();
    }
    
    
    // todo: Sling doesnt seems to like it? or perhaps its a general error. 
    //body = body + '\r\n';

    body = body + endBoundary;
    return body;
}

function cleanup(folder) {
    var files = folder.getFiles();
    if (files.length <= 0) {
        folder.remove();
    } else {
        for (index in files) {
            if (files[index] instanceof Folder) {
                cleanup(files[index]);
            } else {
                var file = new File(files[index].fullName);
                file.remove();
            }
        }
        folder.remove();
    }

}

function collectSubAssets(folder, subAssets) {

    var files = folder.getFiles();
    for (index in files) {
        if (files[index] instanceof Folder) {
            collectSubAssets(files[index], subAssets);
        } else {
            var outputFile = new File(files[index].fullName);

            // Avoid using fileName from the File Object as it got mashed up in the File Object due to default encoding.
            var fileName = files[index].fullName.substring(files[index].fullName.lastIndexOf ('/')+1);

            var ext = fileName.substring(fileName.lastIndexOf('.') +1);
            var ignorePattern = new RegExp('^related-snippet-');
            if (ext != 'html' && !ignorePattern.test(fileName)) {
                var subAsset = new Object();
                subAsset.fileName = fileName;
                subAsset.file = outputFile;
                subAssets.push(subAsset);
            }
        }
    }
}

function downloadInaccessibleAEMLinks(document, sourceFolder, host, credentials){
	$.writeln("Starting inaccessible AEM link handling.");

    var links = document.links;

    for (var j = 0; j < links.length; j++) {
        var link = links[j];
        var linkResourceUri = link.linkResourceURI;
        
        if(link.status==LinkStatus.LINK_INACCESSIBLE && linkResourceUri.lastIndexOf('aems://', 0) === 0){
            
            var aemPath = linkResourceUri.substring(linkResourceUri.lastIndexOf('/content/dam'));
            var linkSourceFile = new File(sourceFolder.fullName + '/' + Date.now() + '_' + link.name);
            $.writeln('Seen AdobeAssetLink link with path: ' + aemPath); 
            // Ensure url is decoded
            aemPath = decodeURI(aemPath);
            $.writeln('Trying to fetch inaccessible link asset from CQ: ' + host + aemPath + ' to ' + linkSourceFile);
            fetchResource (host, credentials, aemPath, linkSourceFile);
            
            link.relink(linkSourceFile);
            $.writeln("Link relinked");
        }

    }
    $.writeln('Finished inaccessible AEM link handling.');
}

(function () {
    var returnObj = {}, aemHost, base64EncodedAEMCreds, cfPath, contentJson,
        templatePath = "C:/dev/projects/jpmc/docs/footnote-indication-template.indd";

    function createInDesignDoc() {
        cfPath = contentJson.path;

        var sourceFolder = getSourceFolder(),
            fileName = cfPath.substring(cfPath.lastIndexOf ('/') + 1),
            templateFile = new File(templatePath),
            documentFile = new File(sourceFolder.fullName + "/" + fileName + '.indd'),
            pdfOutputFile = new File(sourceFolder.fullName + "/" + fileName + '.pdf');

        templateFile.copy(documentFile);

        var document = app.open(documentFile);

        for(var eleName in contentJson){
            if(eleName == "path"){
                continue;
            }

            var firstPage = document.pages[0];
            var firstTextFrame = firstPage.textFrames[0];

            firstTextFrame.contents = contentJson[eleName];

            replaceBoldTags(firstTextFrame);

            replaceParagraphTags(firstTextFrame, "<p>&nbsp;</p>");
            replaceParagraphTags(firstTextFrame, "<p>");
            replaceParagraphTags(firstTextFrame, "</p>");

            changeNbsp(firstTextFrame);
        }


        document.save();

        document.exportFile(ExportFormat.pdfType, pdfOutputFile);

        //document.close(SaveOptions.no);

        var uploadPath = cfPath.substring(0, cfPath.lastIndexOf("/"));

        //$.writeln('Uploading Indesign, pdf files to - ' + uploadPath);

        //uploadDAMFile(aemHost, base64EncodedAEMCreds, pdfOutputFile, pdfOutputFile.name, 'application/pdf', uploadPath);
        //uploadDAMFile(aemHost, base64EncodedAEMCreds, documentFile, documentFile.name, 'application/indd', uploadPath);

        returnObj.success = "completed";
    }

    function replaceBoldTags(textFrame){
        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
        app.changeGrepPreferences.changeTo = "$3";

        var tfFont = "Calibri";
        textFrame.parentStory.appliedFont = tfFont;

        app.changeGrepPreferences.appliedCharacterStyle = getBoldStyle(document, tfFont);

        app.findGrepPreferences.findWhat = "(<strong(\\s.*)?>)(.+?)(</strong(\\s.*)?>)";
        textFrame.changeGrep();

        app.findGrepPreferences.findWhat = "(<b(\\s.*)?>)(.+?)(</b(\\s.*)?>)";
        textFrame.changeGrep();

        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
    }

    function changeNbsp(textFrame){
        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.NOTHING;
        app.changeGrepPreferences.changeTo = " ";

        app.findGrepPreferences.findWhat = "&nbsp;";
        textFrame.changeGrep();

        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.nothing;
    }

    function replaceParagraphTags(textFrame, findSeq){
        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.NOTHING;
        app.findGrepPreferences.findWhat = findSeq;

        var texts = textFrame.findGrep();

        for (var i = 0; i < texts.length; i++) {
            var text = texts[i];
            text.remove();
        }

        app.findGrepPreferences = app.changeGrepPreferences = NothingEnum.NOTHING;
    }

    function getBoldStyle(document, font) {
        var boldCharacterStyle = document.characterStyles.add();

        boldCharacterStyle.appliedFont = font;
        boldCharacterStyle.fontStyle = "Bold";
        //boldCharacterStyle.pointSize = 28;

        return boldCharacterStyle;
    }

    function getSourceFolder(){
        var today = new Date(),
            folderName = today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate() + "-" + today.getHours()
                            + "-" + today.getMinutes() + "-" + today.getSeconds();

        var sourceFolder = new Folder(folderName);
        sourceFolder.create();

        return sourceFolder;
    }

    function setParamsFromScriptArgs(){
        if (app.scriptArgs.isDefined("base64EncodedAEMCreds")) {
            base64EncodedAEMCreds = app.scriptArgs.getValue("base64EncodedAEMCreds");
        } else {
            throw "AEM host credentials argument is missing";
        }

        if (app.scriptArgs.isDefined("aemHost")) {
            aemHost = app.scriptArgs.getValue("aemHost");
        } else {
            throw "aemHost argument is missing";
        }

        if (app.scriptArgs.isDefined("contentJson")) {
            contentJson = JSON.parse(app.scriptArgs.getValue("contentJson"));
            $.writeln('contentJson: ' + app.scriptArgs.getValue("contentJson"));
        } else {
            throw "contentJson argument missing";
        }

        $.writeln('base64EncodedAEMCreds --- ' + base64EncodedAEMCreds);
        $.writeln('aemHost --- ' + aemHost);
    }

    function uploadDAMFile(host, credentials, file, fileName, contentType, aemFolderPath) {
        var transformedHost = transformHost(host);
        host = transformedHost.host;
        var contextPath = transformedHost.contextPath

        var success = false;
        var statusFromServer = 0;
        var retries = 0;

        while(!success && retries<5){
            file.open ("r");
            file.encoding = "BINARY";
            var boundary = '----------V2ymHFg03ehbqgZCaKO6jy';
            var connection = new Socket;
            if (connection.open (host, "binary")) {
                connection.write ("POST "+ encodeURI(contextPath + aemFolderPath + ".createasset.html") +" HTTP/1.0");
                connection.write ("\n");
                connection.write ("Authorization: Basic " + credentials);
                connection.write ("\n");
                connection.write ("User-Agent: Jakarta Commons-HttpClient/3.1");
                connection.write ("\n");
                connection.write ("Content-Type: multipart/form-data; boundary="+boundary);
                connection.write ("\n");
                var body = getMultiPartBodyDAMUpload(boundary, file, fileName, contentType);
                connection.write ("Content-Length: "+body.length);
                connection.write ("\r\n\r\n");
                //END of header
                connection.write (body);

                statusFromServer = readResponse(connection);

                if(statusFromServer>=400){
                    $.writeln('Seen error response '+statusFromServer+' ['+retries+']');
                } else if (statusFromServer>=300) {
                    $.writeln('Redirects currently not supported');
                } else if (statusFromServer>=200) {
                    success=true;
                }

                if(!success){
                    ++retries;
                }
            } else {
                $.writeln('Connection to host ' + host + ' could not be opened');
            }
            file.close();
        }

        if(success){
            addFilenameToManifest(target, fileName);
        } else {
            $.writeln('Failed writing file '+fileName);
            throw ('Unable to upload resource to AEM : '+ fileName);
        }

    }

    function getMultiPartBodyDAMUpload(boundary, file, fileName, contentType) {
        var endBoundary = '\r\n--' + boundary + '--\r\n';
        var body;

        body = '--'+boundary+'\r\n';

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="_charset_"';
        body = body + '\r\n\r\n';
        body = body + 'utf-8';
        body = body + '\r\n';

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="fileName"';
        body = body + '\r\n\r\n';
        body = body + fileName;
        body = body + '\r\n';

        body = body + '--'+boundary+'\r\n';
        body = body + 'content-disposition: form-data; name="file"; filename="'+Base64._utf8_encode(fileName)+'"\r\n';

        if (contentType) {
            body = body + 'Content-Type: '+contentType+'\r\n';
        }
        body = body + 'Content-Transfer-Encoding: binary\r\n';
        body = body + '\r\n';

        var content;
        while ((content = file.read ()) != '') {
            body = body + content;
        }

        file.close();

        body = body + endBoundary;
        return body;
    }

    function setTestParams(){
        aemHost = "localhost.charlesproxy.com:4502";
        base64EncodedAEMCreds = "YWRtaW46YWRtaW4=";
        contentJson = {"rteText":'<h2>Chase Freedom Unlimited</h2>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><span style="color: rgb(57,204,204);"><b>Cash Back And Points:</b>&nbsp;See your&nbsp;<a href="/content/dam/card/rulesregulations/en/RPA0509_Web.pdf" target="Target">Rewards Program Agreement (PDF)</a>&nbsp;for more details.</span><br>\n' +
                '</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><span style="color: rgb(133,20,75);"><b>Chase Offers:</b>&nbsp;Chase is wholly responsible only for posting the statement credit to your account based on the data it receives from its third-party service provider. The statement credit will appear on your statement within 14 business days of Chase’s receipt of the information.</span></p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Chase Mobile App:</b>&nbsp;Chase Mobile®&nbsp;app is available for select mobile devices. Message and data rates may apply.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Gift Cards:</b>&nbsp;Subject to availability. Digital gift cards may not be available to all customers at all times. See gift cards for details, terms, conditions and (if applicable) fees. All trademarks are property of their respective owners. Product may not be available in all states. The gift cards featured are not sponsors or otherwise affiliated with this company.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Shop With Points:</b>&nbsp;When using points at checkout, each point is worth $0.008, which means that 100 points equals $0.80 in redemption value.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><a href="https://www.amazon.com/" target="Target">Amazon.com</a>&nbsp;Shop with Points service terms apply.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p>Amazon, the Amazon.com logo, the smile logo, and all related logos are trademarks of Amazon.com, Inc. or its affiliates.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Score Planner:</b>&nbsp;This score planner resource does not guarantee you will reach your credit score goal even if you complete the recommended actions, as there are other factors that may impact your VantageScore. This resource should be used for educational purposes only. There are various types of credit scores that lenders can access to make a lending decision. The credit score you receive is based on the VantageScore®&nbsp;3.0 model and may not be the credit score model used by your lender or by Chase.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Cardmembers Eligible for Chase Pay Over Time:</b>&nbsp;Eligible cardmembers are those with access to Chase Pay Over Time who use a participating Chase credit card for eligible purchases. Access to Chase Pay Over Time is not guaranteed, is based on a variety of factors such as creditworthiness, credit limit and account behavior, and may change from time to time. Participating Chase credit cards are consumer credit cards issued by Chase, small business cards are excluded at this time. For Chase Pay Over Time at checkout on Amazon.com, Amazon Visa and Prime Visa cards and Chase Mastercard credit cards are also excluded.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Purchases Eligible for Chase Pay Over Time Set Up After Purchase:</b>&nbsp;Purchases of at least $100 are eligible, excluding certain transactions such as (a) cash-like transactions, (b) any fees owed to us, including Annual Membership Fees, and (c) purchases made under a separate promotion or special finance program. Eligible purchases will be identified within your transaction history on chase.com or the Chase Mobile App.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p><b>Chase Pay Over Time Fee:</b>&nbsp;The Chase Pay Over Time Fee for plans set up after purchase is 1.72% of the amount of each eligible purchase transaction or amount selected to create a Pay Over Time plan. The Pay Over Time Fee will be determined at the time each Pay Over Time plan is created and will remain the same until the Pay Over Time plan balance is paid in full. The Pay Over Time Fee is based on the amount of each purchase transaction selected to create the plan, the number of billing periods you choose to pay the balance in full, and other factors.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p>INSTACART®, the Instacart Carrot logo, the Instacart Partial Carrot logo, and the Instacart Carrot Top logo are trademarks of Maplebear Inc., d/b/a Instacart. Instacart may not be available in all zip or post codes. See Instacart Terms of Service for more details.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p>AirPods, Apple, Apple TV, Apple Watch, HomePod, iMac, iPad, iPad Pro, iPhone, MacBook and MacBook Pro are registered trademarks of Apple Inc. All rights reserved.</p>\n' +
                '<p>&nbsp;</p>\n' +
                '<p>The Contactless Symbol and Contactless Indicator are trademarks owned by and used with the permission of EMVCo, LLC.</p>\n',
            "path":"/content/dam/experience-aem/bold"}
    }

    try{
        //setParamsFromScriptArgs();

        setTestParams();

        createInDesignDoc();
    }catch(err){
        returnObj.error = err;
        $.writeln(err);
    }finally{
    }

    //return JSON.stringify(returnObj);
}());
