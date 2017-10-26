require('angular');
require('angular-animate');
require('angular-aria');
require('angular-material');
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main');



var filePath = null;

var RaffleApp = angular.module('RaffleApp', ['ngMaterial']);

RaffleApp.controller('RaffleMainCtrl', function RaffleMainCtrl($scope, $rootScope) {
  var vm = $scope;
  $rootScope.prize = "";
  $rootScope.una = false;

  vm.isCreating = false;

  vm.isPlaying = false;
  vm.showPrizeCount = false;

  vm.openFile = function openFile() {
    filePath = mainProcess.getFileFromUserSelection();
    vm.isCreating = false;
    vm.isPlaying = true;
  };

  vm.saveFile = function saveFile(raffle) {
    filePath = mainProcess.saveRaffle(filePath, JSON.stringify(raffle));
    if (filePath === null) {
      return;
    }
    vm.isCreating = false;
    vm.isPlaying = true;
  };

  vm.createRaffle = function createRaffle() {
    vm.isCreating = true;
    vm.isPlaying = true;
  };

  vm.showThePrizeCount = function showThePrizeCount() {
    vm.showPrizeCount = !vm.showPrizeCount;
  };
});


RaffleApp.controller('RaffleCreateCtrl', function RaffleCreateCtrl($scope, $mdDialog, $rootScope) {
  var vm = $scope;
  var Wheel = new Audio('./sounds/Wheel.mp3');
  var taDa = new Audio('./sounds/Ta Da.mp3');
  vm.raffle = {
    raffleName: "",
    numSegments: 2,
    total: 0,
    ProportionalChance: true,
    segments: [{
      name: "",
      qty: 1,
      color: "#ffffff",
      textColor: "#000000",
      una: false
    }]
  };


  vm.myWheel = null;
  vm.isRotating = false;

  vm.addPrize = function addPrize() {
    vm.raffle.segments.push({
      name: "",
      qty: 1,
      color: "#ffffff",
      textColor: "#000000",
      una: false
    });
  };

  vm.deletePrize = function deletePrize(index) {
    if (vm.raffle.segments.length === 1) return;
    vm.raffle.segments.splice(index, 1);
    vm.createPreview();
  };

  ipcRenderer.on('file-opened', function (event, file, content) {
    filePath = file;
    vm.raffle = JSON.parse(content);
    vm.createPreview();
    $scope.$apply();
  });

  function totalPrizes() {
    var total = 0;
    vm.raffle.segments.forEach(function (element) {
      total += element.qty;
    }, this);
    return total;
  }

  vm.spinWheel = function spinWheel() {
    if (!vm.isRotating && !vm.isCreating) {
      if (vm.raffle.ProportionalChance) {
        vm.myWheel.animation.stopAngle = calculatePrizeAngle();
      }
      Wheel.play();
      vm.myWheel.startAnimation();
    }
  };
  
  var calculatePrizeAngle = function calculatePrizeAngle() {
    var segment = getSegmentByProb();
    return ((segment.degressRange.min + 1) + Math.floor((Math.random() * (segment.degressRange.max - segment.degressRange.min - 2))));
  };

  var getSegmentByProb = function getSegmentByProb() {
    var percent = Math.random() * 100;
    for (var index = 0; index < vm.raffle.segments.length; index++) {
      var element = vm.raffle.segments[index];
      if (percent >= element.probabilityRange.min && percent <= element.probabilityRange.max) {
        return element;
      }
    }

    return null;
  };

  vm.alertPrize = function alertPrize() {
    var winningSegment = vm.myWheel.getIndicatedSegment();
    $rootScope.prize = winningSegment.text;
    $rootScope.una = vm.getUna(winningSegment.text);
    $scope.showAdvanced();
  };

  vm.getUna = function getUna(name) {
    for (var i = 0; i < vm.raffle.segments.length; i++) {
      var element = vm.raffle.segments[i];

      if (element.name === name) {
        return element.una;
      }
    }
  };

  vm.prizeWon = function prizeWon(prize) {
    vm.raffle.segments.forEach(function (element) {
      if (element.name === prize && element.qty >= 0) {
        element.qty -= 1;
      }
    }, this);
  };

  $scope.showAdvanced = function (ev) {
    $mdDialog.show({
      controller: DialogController,
      templateUrl: 'dialog1.tmpl.html',
      parent: angular.element(document.body),
      targetEvent: ev,
      clickOutsideToClose: true,
      fullscreen: true // Only for -xs, -sm breakpoints.
    })
      .then(function (prize) {
        vm.prizeWon(prize);
        vm.saveFile(vm.raffle);
        vm.createPreview();
      }, function () {
        vm.createPreview();
      });
  };

  function DialogController($scope, $mdDialog, $rootScope) {
    $scope.prize = $rootScope.prize;
    $scope.una = $rootScope.una;
    taDa.play();
    $scope.hide = function () {
      $mdDialog.hide();
    };

    $scope.cancel = function () {
      $mdDialog.cancel();
    };

    $scope.confirmPrize = function (prize) {
      $mdDialog.hide(prize);
    };
  }


  vm.getContrastYIQ = function getContrastYIQ(hexcolor) {
    var r = parseInt(hexcolor.substring(1, 3), 16);
    var g = parseInt(hexcolor.substring(3, 5), 16);
    var b = parseInt(hexcolor.substring(5, 7), 16);
    var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    return (yiq >= 128) ? '#000000' : "#ffffff";
  };

  vm.createPreview = function createPreview() {

    var degressRange = 0;
    var probabilityRange = 0;

    vm.raffle.total = totalPrizes();
    var raffle = {
      'numSegments': vm.raffle.segments.length,
      'segments': [],
      'pins' : true,
      'lineWidth': 2,
      'animation': {
        'type': 'spinToStop',
        'duration': 5,
        'spins': 8,
        'callbackFinished': 'angular.element(document.getElementById("canvas")).scope().alertPrize()'
      }

    };
    vm.raffle.segments.forEach(function (element) {

      var segmentDegrees = 360 / raffle.numSegments;
      element.degressRange = {min: degressRange, max: degressRange + segmentDegrees};
      degressRange += segmentDegrees;

      element.probability = element.qty / vm.raffle.total * 100;
      element.probabilityRange = {min: probabilityRange, max: probabilityRange + element.probability};
      probabilityRange += element.probability;
      
      element.textColor = vm.getContrastYIQ(element.color);

      if (element.qty !== 0) {
        raffle.segments.push({
          'fillStyle': element.color,
          'text': element.name,
          'textFillStyle': element.textColor,
          'textFontSize': 45
        });
      }

      else{
        if (raffle.numSegments !== 0) {
          raffle.numSegments -= 1;
        }
      }
    }, this);

    vm.myWheel = new Winwheel(raffle);
  };
});
