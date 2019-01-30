'use strict';

const electron = require('electron');
const remote = electron.remote;
const pageListService = remote.require('./lib/pageListService');
const {ipcRenderer} = require('electron');

const ngModule = angular.module('webKohShin', ['ngSanitize']);

ngModule.controller('MainController', function ($scope) {
  const main = this;

  main.pageList = pageListService.getList();
  main.newUrl = null;

  main.addUrl = function () {
    main.pageList = pageListService.addUrl(main.newUrl);
  }
  main.deleteUrl = function (url) {
    main.pageList = pageListService.deleteUrl(url);
  }
  main.check = function () {
    pageListService.checkUpdate()
      .then(newList => {
        $scope.$apply(() => {
          main.pageList = newList;
        });
      });
  }
  main.openUrl = (url) => {
    const {shell} = require('electron');
    shell.openExternal(url);
  }
  main.urlLabel = (url) => url.length > 80 ? url.substr(0, 80) + '...' : url;

  ipcRenderer.on('list-updated', (event, newList) => {
    $scope.$apply(() => {
      main.pageList = newList;
    });
  })
});
