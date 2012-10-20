var FrameHandler = require('../../index').FrameHandler
  , util = require('util');

function MyFrameHandler(device) {
    // call super class
    FrameHandler.call(this, device);
}

util.inherits(MyFrameHandler, FrameHandler);

// MyFrameHandler.prototype.analyzeNextFrame = function(incomming) {
//     return incomming.splice(0);
// };

// MyFrameHandler.prototype.unwrapFrame = function(frame) {
//     return frame;
// };

// MyFrameHandler.prototype.wrapFrame = function(frame) {
//     return frame;
// };

module.exports = MyFrameHandler;