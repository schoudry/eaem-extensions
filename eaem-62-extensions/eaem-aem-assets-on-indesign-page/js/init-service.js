'use strict';

(function () {
    var underscore = angular.module('underscore', []);
    underscore.factory('_', function () {
        return window._;
    });

    var cep = angular.module('cep', []);
    cep.service('csi', CSInterface);
    cep.factory('cep', ['$window', function ($window) {
        return $window.cep;
    }]);
    cep.factory('fs', ['cep', function (cep) {
        return cep.fs;
    }]);
    cep.factory('nfs', ['cep', function (cep) {
        return require("fs");
    }]);
    cep.factory('nhttp', function () {
        return require("http");
    });
    cep.factory('nqs', function () {
        return require('querystring')
    });
    cep.factory('nbuffer', function () {
        return require('buffer');
    });
}());
