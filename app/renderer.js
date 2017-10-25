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
  vm.showPrizeCount = true;

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

  vm.spinWheel = function () {
    if (!vm.isRotating && !vm.isCreating) {
      vm.myWheel.startAnimation();
    }
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

    vm.raffle.total = totalPrizes();
    var raffle = {
      'numSegments': vm.raffle.segments.length,
      'segments': [],
      'lineWidth': 2,
      'animation': {
        'type': 'spinToStop',
        'duration': Math.random() * (5 - 2) + 2,
        'spins': Math.random() * (8 - 4) + 4,
        'callbackFinished': 'angular.element(document.getElementById("canvas")).scope().alertPrize()'
      }

    };
    vm.raffle.segments.forEach(function (element) {
      element.textColor = vm.getContrastYIQ(element.color);
      if (element.qty !== 0) {
        raffle.segments.push({
          'fillStyle': element.color,
          'text': element.name,
          'textFillStyle': element.textColor,
          'textFontSize': 45
        });
        if (vm.raffle.ProportionalChance) {
          raffle.segments[raffle.segments.length - 1].size = winwheelPercentToDegrees(element.qty / vm.raffle.total * 100);
        }
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

// var myWheel = new Winwheel({
//   'numSegments'    : 2,
//   'outerRadius'    : 170,
//   'segments'       :
//   [
//      {'fillStyle' : '#eae56f', 'text' : 'Prize 1', 'size': winwheelPercentToDegrees(1)},
//      {'fillStyle' : '#89f26e', 'text' : 'Prize 2', 'size': winwheelPercentToDegrees(99)}
//   ],
//   'animation' :
//   {
//       'type'     : 'spinToStop',
//       'duration' : 5,
//       'spins'    : 8,

//       // Remember to do something after the animation has finished specify callback function.
//       'callbackFinished' : 'alertPrize()',

//       // During the animation need to call the drawTriangle() to re-draw the pointer each frame.
//       'callbackAfter' : 'drawTriangle()'
//   }
// });

// // This function called after the spin animation has stopped.
// function alertPrize()
// {
//   // Call getIndicatedSegment() function to return pointer to the segment pointed to on wheel.
//   var winningSegment = myWheel.getIndicatedSegment();

//   // Basic alert of the segment text which is the prize name.
//   alert("You have won " + winningSegment.text + "!");

//   myWheel = new Winwheel({
//   'numSegments'    : 2,
//   'outerRadius'    : 170,
//   'segments'       :
//   [
//      {'fillStyle' : '#eae56f', 'text' : 'Prize 1', 'size': winwheelPercentToDegrees(99)},
//      {'fillStyle' : '#89f26e', 'text' : 'Prize 2', 'size': winwheelPercentToDegrees(1)}
//   ],
//   'animation' :
//   {
//       'type'     : 'spinToStop',
//       'duration' : 5,
//       'spins'    : 8,

//       // Remember to do something after the animation has finished specify callback function.
//       'callbackFinished' : 'alertPrize()',

//       // During the animation need to call the drawTriangle() to re-draw the pointer each frame.
//       'callbackAfter' : 'drawTriangle()'
//   }
// });

// }

// // Function to draw pointer using code (like in a previous tutorial).
// drawTriangle();

// function drawTriangle()
// {
//   // Get the canvas context the wheel uses.
//   var ctx = myWheel.ctx;

//   ctx.strokeStyle = 'navy';     // Set line colour.
//   ctx.fillStyle   = 'aqua';     // Set fill colour.
//   ctx.lineWidth   = 2;
//   ctx.beginPath();              // Begin path.
//   ctx.moveTo(170, 5);           // Move to initial position.
//   ctx.lineTo(230, 5);           // Draw lines to make the shape.
//   ctx.lineTo(200, 40);
//   ctx.lineTo(171, 5);
//   ctx.stroke();                 // Complete the path by stroking (draw lines).
//   ctx.fill();                   // Then fill.


// }

