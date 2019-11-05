var fs = require("fs");
var NeuralNetConstructor = require('neuralnet');
//var layers = require("./pick3.layers.json");

var HISTORY_COUNT = 50
var MAX_TRAIN = 1000;
var MAX_PREDICT = 1000;
var TRAINING = true;


var config = {
//layers: layers,
  inputs: HISTORY_COUNT * 3,
  outputs: 3
}

var neuralnet = NeuralNetConstructor(config)

function ball() {
  return Math.floor(Math.random() * 10) / 10;
}
function next() {
  return [ball(), ball(), ball()];
}

var good = 0;

var t = (new Date()).getTime();

var max = TRAINING ? MAX_TRAIN : MAX_PREDICT;
  for(var i = 0; i < max; i++) {
      var t2 = (new Date()).getTime();
      if (t2 - t > 60000) {
        save();
        t = t2;
        var p = Math.floor(10000 * (i / max)) * 0.01;
          console.log("%s%", p);
      }
      var inputs = [];
      for(var h = 0; h < config.inputs; h++) {
        inputs.push(ball())
      }

      var nums = [];
      for(var j = 0; j < config.outputs; j++) {
        nums[j] = ball();
      };

      if (TRAINING) {
        neuralnet.train(inputs, nums);
      } else {
        var prediction = neuralnet.predict(inputs);
        // find a mismatched number
        if(!prediction.some(function(value, index) { return value !== nums[index]})) {
          // no mismatch. we got what we expected
          good++;
        }
      }

    //  inputs.shift();
      //inputs.push(num);
  }

  save();
  if (!TRAINING) {
  console.log("Good Predictions: %s %s%", good, (good / max) * 100)
}

function save() {
  if (TRAINING) {
    fs.writeFile("pick3.layers.json", JSON.stringify(neuralnet.layers, null, "  "), function(error) {
      if (error) console.log(error);
      else console.log("Saved");
    });
  }
}
