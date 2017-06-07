'use strict';

(function () {
    var app = angular.module('SearchAEM', ['aem']);
    app.directive('ngEnter', ngEnterFn);
    app.controller('placeController', PlaceController);

    function ngEnterFn(){
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
    }

    PlaceController.$inject = [ '$scope', 'aemService', 'searchService', '$http', 'csi', 'cep' ];

    function PlaceController($scope, aemService, searchService, $http, csi, cep){
        $scope.damHost = "localhost:4502";
        $scope.showLogin = true;

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

        $scope.login = login;

        $scope.search = search;

        $scope.select = select;

        $scope.place = place;

        $scope.generatePDFAndUpload = generatePDFAndUpload;

        function login() {
            if (!$scope.j_username || !$scope.j_password || !$scope.damHost) {
                alert("Enter credentials");
                return;
            }

            $scope.damHost = $scope.damHost.trim();

            if ($scope.damHost.indexOf("http://") == -1) {
                $scope.damHost = "http://" + $scope.damHost;
            }

            function success(){
                $scope.showLogin = false;
            }

            function error(message){
                alert(message);
            }

            aemService.loginWithNJS($scope.j_username, $scope.j_password, $scope.damHost)
                    .then(success, error);
        }

        function search(){
            if (!$scope.term) {
                alert("Enter search term");
                return;
            }

            $scope.results = [];

            var mapHit = function(hit) {
                var result;

                result = {};

                result.selected = false;
                result.name = aemService.getFilename(hit["jcr:path"]);
                result.path = hit["jcr:path"];
                result.imgPath = aemService.appendLoginToken($scope.damHost + hit["jcr:path"]
                                        + "/jcr:content/renditions/cq5dam.thumbnail.140.100.png");
                result.format = hit["jcr:content"]["metadata"]["dc:format"];

                if(result.format == "text/html"){
                    result.imgPath = "../img/txt.png";
                }

                return result;
            };

            new searchService(searchDefaults).host($scope.damHost)
                .fullText($scope.term)
                .http()
                .then(function(resp) {
                    $scope.results = _.compact(_.map(resp.data.hits, mapHit));
                });
        }

        function select(result){
            result.selected = !result.selected;
        }

        function place(){
            var toDownload = _.reject($scope.results, function(result){
                return !result.selected;
            });

            aemService.downloadWithNJS(_.pluck(toDownload, 'path'))
                        .then(setDownloadedPaths)
                        .then(aemService.placeAssets)
                        .then(aemService.uploadWithNJS)
        }

        function setDownloadedPaths(filePaths){
            _.each($scope.results, function(result){
                result.localPath = filePaths[result.path] || '';
            });

            return filePaths;
        }

        function generatePDFAndUpload(){
            if(_.isEmpty($scope.uploadPath)){
                alert("Enter PDF upload location in AEM");
                return;
            }

            aemService.generatePDF()
                        .then(upload)
                        .then(function(damFilePath){
                            alert("Uploaded - " + damFilePath);
                        });

            function upload(pdfPath){
                return aemService.uploadWithNJS(pdfPath, $scope.uploadPath);
            }
        }
    }
}());


