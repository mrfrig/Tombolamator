require('angular');
require('angular-animate');
require('angular-aria');
require('angular-material');
const { remote, ipcRenderer } = require('electron');
const mainProcess = remote.require('./main');

var filePath = null;

var RaffleApp = angular.module('RaffleApp', ['ngMaterial']);

RaffleApp.controller('RaffleMainCtrl', function RaffleMainCtrl($scope) {
  var vm = $scope;

  vm.openFile = function openFile() {
    mainProcess.getFileFromUserSelection();
  };

  vm.saveFile = function saveFile() {
    mainProcess.saveRaffle(filePath, JSON.stringify(vm.raffle));
  };
});

RaffleApp.controller('RaffleHomeCtrl', function RaffleHomeCtrl($scope) {});


RaffleApp.controller('RaffleCreateCtrl', function RaffleCreateCtrl($scope) {
  var vm = $scope;
  vm.raffle = {
    raffleName: "",
    numSegments: 2,
    segments: [{
      name: "",
      qty: 1,
      color: "#ffffff"
    },{
      name: "",
      qty: 1,
      color: "#ffffff"
    }]
  };

  vm.ProportionalChance = true;


  vm.myWheel = null;

  vm.addPrize = function addPrize() {
    vm.raffle.segments.push({
      name: "",
      qty: 1,
      color: "#ffffff"
    });
  };

  vm.deletePrize = function deletePrize(index) {
    console.log(index);
    vm.raffle.segments = vm.raffle.segments.splice(index);
  };

  ipcRenderer.on('file-opened', function(event, file, content){
    filePath = file;
    console.log(file);
    vm.raffle = JSON.parse(content);
    $scope.$apply();
  });

  function totalPrizes() {
    var total = 0;
    vm.raffle.segments.forEach(function(element) {
      total += element.qty;
    }, this);
    return total;
  }

  

  vm.createPreview = function createPreview() {
    var total = totalPrizes();
    var raffle = {'numSegments': vm.raffle.segments.length,'segments': []};
    vm.raffle.segments.forEach(function(element) {
      raffle.segments.push({
        'fillStyle' : element.color, 
        'text' : element.name
      });
      if (vm.ProportionalChance) {
        raffle.segments[raffle.segments.length - 1].size = winwheelPercentToDegrees(element.qty/total*100);
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