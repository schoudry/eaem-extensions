'use strict';

(function () {
    var aem = angular.module('aem', ['underscore', 'cep']);
    aem.service('aemService', AEMService);
    aem.factory('searchService', SearchService);

    AEMService.$inject = [ '_', 'csi', 'fs', '$http', '$rootScope' ,'nhttp', 'nqs', 'nfs', 'nbuffer', '$q' ];

    function AEMService(_, csi, fs, $http, $rootScope, nhttp, nqs, nfs, nbuffer, $q){
        return {
            getFilename: getFilename,
            loginWithNJS: loginWithNJS,
            appendLoginToken: appendLoginToken,
            getDownloadPath: getDownloadPath,
            downloadWithNJS: downloadWithNJS,
            uploadWithNJS: uploadWithNJS,
            placeAssets: placeAssets,
            generatePDF: generatePDF
        };

        function isCEPError(error){
            return _.isEmpty(error) || (error.toUpperCase() == "ERROR");
        }

        function placeAssets(filePaths) {
            if (_.isEmpty(filePaths)) {
                return $q.when({});
            }

            var deferred = $q.defer();

            function handler(result) {
                if (isCEPError(result)) {
                    deferred.reject("Error placing assets");
                    return;
                }

                deferred.resolve(result);
            }

            csi.evalScript("EAEM.placeAssets('" + _.values(filePaths).join(",") + "')", handler);

            return deferred.promise;
        }

        function generatePDF() {
            var deferred = $q.defer();

            function handler(result) {
                if (isCEPError(result)) {
                    deferred.reject("Error generating PDF");
                    return;
                }

                deferred.resolve(result);
            }

            csi.evalScript("EAEM.exportAsPDF()", handler);

            return deferred.promise;
        }

        function getFilename(path) {
            path = path ? path.replace(/\\/g, '/') : '';
            return path.substring(path.lastIndexOf('/') + 1);
        }

        function getDownloadPath(){
            var folderPath = csi.getSystemPath(SystemPath.MY_DOCUMENTS) + "/eaem";
            fs.makedir(folderPath);

            return folderPath;
        }

        function getHostPort(host){
            var arr = [];

            if(host.indexOf("/") >= 0){
                host = host.substring(host.lastIndexOf("/") + 1);
            }

            if(host.indexOf(":") < 0){
                arr.push(host);
                arr.push("80")
            }else{
                arr.push(host.split(":")[0]);
                arr.push(host.split(":")[1]);
            }

            return arr;
        }

        //login with nodejs to capture login cookie
        function loginWithNJS(username, password, damHost){
            var hp = getHostPort(damHost);

            if(!_.isEmpty($rootScope.dam)){
                return $q.when($rootScope.dam);
            }

            var deferred = $q.defer(), dam = { host : damHost };

            var options = {
                hostname: hp[0],
                port: hp[1],
                path: "/libs/granite/core/content/login.html/j_security_check",
                headers: {
                    'Content-type': 'application/x-www-form-urlencoded'
                },
                method: 'POST'
            };

            var req = nhttp.request(options, function(res) {
                var cookies = res.headers["set-cookie"];

                _.each(cookies, function(cookie){
                    if(cookie.indexOf("login-token") == -1){
                        return;
                    }

                    dam.loginToken = cookie.split('login-token=')[1];
                });

                if(_.isEmpty(dam.loginToken)){
                    deferred.reject("Trouble logging-in, Invalid Credentials?");
                    return;
                }

                $rootScope.dam = dam;

                $http.get( appendLoginToken(dam.host + '/libs/granite/csrf/token.json')).then(function(data){
                    dam.csrfToken = data.data.token;
                    deferred.resolve(dam);
                })
            });

            req.on('error', function(e) {
                deferred.reject("Trouble logging-in, Invalid Credentials?");
            });

            var data = nqs.stringify({
                _charset_: "UTF-8",
                j_username: username,
                j_password: password,
                j_validate: true
            });

            req.write(data);
            req.end();

            return deferred.promise;
        }

        function appendLoginToken(url){
            return url + (url.indexOf("?") == -1 ? "?" : "&") + "j_login_token=" + $rootScope.dam.loginToken;
        }

        function downloadWithNJS(damPaths){
            if(_.isEmpty(damPaths)){
                return $q.when({});
            }

            damPaths = _.uniq(damPaths);

            var deferred = $q.defer(), filePaths = {},
                count = damPaths.length, dam = $rootScope.dam;

            _.each(damPaths, handler);

            return deferred.promise;

            function handler(damPath){
                damPath = decodeURIComponent(damPath);

                var url = appendLoginToken(dam.host + damPath),
                    filePath = getDownloadPath() + "/" + getFilename(damPath);

                if (nfs.existsSync(filePath)) {
                    nfs.unlinkSync(filePath);
                }

                var file = nfs.openSync(filePath, 'w');

                var req = nhttp.get(url, function(res) {
                    if(res.statusCode == 404){
                        handle404(damPath);
                        return;
                    }

                    res.on('data', function(chunk) {
                        nfs.writeSync(file, chunk, 0, chunk.length);
                    });

                    res.on('end', function() {
                        nfs.closeSync(file);

                        count--;

                        filePaths[damPath] = filePath;

                        if(count != 0){
                            return;
                        }

                        deferred.resolve(filePaths);
                    });
                });

                req.on('error', function(e) {
                    deferred.reject("Error downloading file");
                });
            }

            function handle404(damPath){
                alert("Asset Not Found - " + damPath);
            }
        }

        function uploadWithNJS(localPath, damFolderPath){
            if(_.isEmpty(localPath) || _.isEmpty(damFolderPath)){
                return $q.when( { "error" : "Empty paths"} );
            }

            var BUFFER_SIZE =  5 * 1024 * 1024, // 5MB
                dam = $rootScope.dam,
                uploadPath = appendLoginToken(dam.host + damFolderPath + ".createasset.html"),
                file = nfs.openSync(localPath, 'r'),
                deferred = $q.defer();

            readNextBytes(0);

            return deferred.promise;

            function readNextBytes(offset){
                var buffer = nbuffer.Buffer(BUFFER_SIZE, 'base64'),
                    bytes = nfs.readSync(file, buffer, 0, BUFFER_SIZE, null),
                    complete = false;

                if (bytes < BUFFER_SIZE) {
                    buffer = buffer.slice(0, bytes);
                    complete = true;
                }

                uploadBlob(getBlob(buffer), offset, complete);
            }

            function uploadBlob(blob, offset, complete) {
                var fd = new FormData();

                fd.append('file', blob);
                fd.append("fileName", getFilename(localPath));
                fd.append("file@Offset", offset);
                fd.append("file@Length", 0);
                fd.append("file@Completed", complete);
                fd.append("_charset_", "utf-8");

                return $http.post(uploadPath, fd, {
                    transformRequest: angular.identity, //no transformation return data as-is
                    headers: {
                        'CSRF-Token' : dam.csrfToken,
                        'Content-Type': undefined //determine based on file type
                    }
                }).then(function () {
                    if (complete) {
                        nfs.closeSync(file);
                        deferred.resolve(damFolderPath + "/" + getFilename(localPath));
                        return;
                    }
                    readNextBytes(offset + BUFFER_SIZE);
                }, failure);

                function failure() {
                    nfs.closeSync(file);
                    alert("Error upoading");
                }
            }

            function getBlob(fileOrBytes){
                var bytes = fileOrBytes.data ? atob(decodeURIComponent(escape(fileOrBytes.data)).replace(/\s/g, ''))
                    : fileOrBytes;

                var bArrays = [];
                var SLICE_LEN = 1024, end, slice, nums;

                for (var offset = 0; offset < bytes.length; offset = offset + SLICE_LEN) {
                    end = offset + SLICE_LEN;
                    slice = bytes.slice(offset, end < bytes.length ? end : bytes.length);
                    nums = new Array(slice.length);

                    for (var i = 0; i < slice.length; i++) {
                        nums[i] = fileOrBytes.data ? slice.charCodeAt(i) : slice[i];
                    }

                    bArrays.push(new Uint8Array(nums));
                }

                return new Blob(bArrays, {
                    type: "application/octet-binary"
                });
            }
        }
    }

    SearchService.$inject = [ '_', '$http', '$rootScope' ];

    function SearchService(_, $http, $rootScope){
        return function (defaults) {
            this.aem = "http://localhost:4502";
            this.params = _.extend( { j_login_token : $rootScope.dam.loginToken }, defaults);
            this.numPredicates = 0;

            this.host = function(aem){
                this.aem = aem;
                return this;
            };

            this.fullText = function (value) {
                if (!value) {
                    return this;
                }

                this.params[this.numPredicates + '_fulltext'] = value;
                this.numPredicates++;

                return this;
            };

            this.http = function(){
                var builder = this;

                return $http({
                    method: 'GET',
                    url: builder.aem + "/bin/querybuilder.json",
                    params: builder.params
                });
            }
        }
    }
}());
