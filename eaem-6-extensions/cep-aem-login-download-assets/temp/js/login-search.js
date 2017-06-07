'use strict';

(function () {
    var underscore = angular.module('underscore', []);

    underscore.factory('_', function () {
        return window._;
    });

    var cep = angular.module('cep', []);

    cep.factory('cep', ['$window', function ($window) {
        return $window.cep;
    }]);

    cep.service('csi', CSInterface);

    var aem = angular.module('aem', ['underscore', 'cep']);

    aem.service('login', [ '$http' , '_', function ($http, _) {
        return {
            login: function (username, password, damHost) {
                var jSecurityCheck = damHost + "/libs/granite/core/content/login.html/j_security_check";

                var data = {
                    j_username: username,
                    j_password: password,
                    j_validate: true
                };

                return $http.post(jSecurityCheck, data, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    },
                    transformRequest: function(obj) {
                        var params = [];

                        angular.forEach(obj, function(value, key){
                            params.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
                        });

                        return params.join("&");
                    }
                });
            }
        }
    }]);

    aem.factory('search', [ '_', '$http', function (_, $http) {
        return function (defaults) {
            this.aem = "http://localhost:4502";
            this.params = _.extend({}, defaults);
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
    }]);

    var app = angular.module('SearchAEM', ['aem']);

    app.directive('ngEnter', function () {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });

    app.controller('pc', [ '$scope', 'login', 'search', '$http', 'csi', 'cep',
        function ($scope, login, search, $http, csi, cep) {
            $scope.damHost = "localhost:4502";
            $scope.showLogin = true;

            $scope.login = function () {
                if (!$scope.j_username || !$scope.j_password || !$scope.damHost) {
                    alert("Enter credentials");
                    return;
                }

                $scope.damHost = $scope.damHost.trim();

                if ($scope.damHost.indexOf("http://") == -1) {
                    $scope.damHost = "http://" + $scope.damHost;
                }

                login.login($scope.j_username, $scope.j_password, $scope.damHost)
                    .success(function (data) {
                        $scope.showLogin = false;
                    })
                    .error(function () {
                        alert("Trouble logging-in, Invalid Credentials?")
                    })
            };

            var searchDefaults = {
                'path': "/content/dam",
                'type': 'dam:Asset',
                'orderby': '@jcr:content/jcr:lastModified',
                'orderby.sort': 'desc',
                'p.hits': 'full',
                'p.nodedepth': 2,
                'p.limit': 25,
                'p.offset': 0
            };

            $scope.search = function () {
                if (!$scope.term) {
                    alert("Enter search term");
                    return;
                }

                $scope.results = [];

                var mapHit = function(hit) {
                    var result;

                    result = {};

                    result.name = hit["jcr:path"].substring(hit["jcr:path"].lastIndexOf("/") + 1);
                    result.url = $scope.damHost + hit["jcr:path"];
                    result.imgPath = $scope.damHost + hit["jcr:path"] + "/jcr:content/renditions/cq5dam.thumbnail.140.100.png";

                    return result;
                };

                new search(searchDefaults).host($scope.damHost)
                        .fullText($scope.term)
                        .http()
                        .then(function(resp) {
                    $scope.results = _.compact(_.map(resp.data.hits, mapHit));
                });
            };

            $scope.download = function(result){
                $http.get(result.url, {
                    responseType: "blob"
                }).success(function(data) {
                    var reader = new FileReader();

                    reader.onload = function() {
                        var filePath = csi.getSystemPath(SystemPath.MY_DOCUMENTS)
                                            + "/" + result.name;
                        cep.fs.writeFile(filePath, reader.result.split(',')[1], cep.encoding.Base64);

                        csi.evalScript("(function(){app.open(new File('" + filePath + "'));})();", function(){
                            alert("File " + result.name + " downloaded as " + filePath)
                        });
                    };

                    reader.readAsDataURL(data);
                }).error(function() {
                    alert("Error downloading file");
                });
            };
    }]);
}());


