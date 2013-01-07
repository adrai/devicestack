var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash');

/**
 * You can have one or multiple framehandlers.
 * A framhandler receives data from the upper layer and sends it to the lower layer by wrapping some header or footer information.
 * A framehandler receives data from lower layer and sends it to the upper layer by unwrapping some header or footer information.
 * The lowest layer for a framehandler is the device and the topmost ist the connection.
 * - reacts on send of upper layer, calls wrapFrame function if exists and calls send function on lower layer
 * - reacts on receive of lower layer, calls unwrapFrame function if exists and emits receive
 * - automatically calls start function
 * @param {Device || FrameHandler} deviceOrFrameHandler Device or framahandler object.
 */
function FrameHandler(deviceOrFrameHandler) {
  var self = this;

  // call super class
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  });

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  }

  if (deviceOrFrameHandler) {
    this.incomming = [];
    deviceOrFrameHandler.on('receive', function (frame) {
      var unwrappedFrame;
      if (self.analyzeNextFrame) {
        self.incomming = self.incomming.concat(Array.prototype.slice.call(frame, 0));
      } else {
        if (self.unwrapFrame) {
          unwrappedFrame = self.unwrapFrame(_.clone(frame));
          if (self.log) self.log('receive unwrapped frame: ' + unwrappedFrame.toHexDebug());
          self.emit('receive', unwrappedFrame);
        } else {
          if (self.log) self.log('receive frame: ' + frame.toHexDebug());
          self.emit('receive', frame);
        }
      }
    });

    deviceOrFrameHandler.on('close', function() {
      if (self.log) self.log('close');
      self.stop();
      self.emit('close');
      self.removeAllListeners();
      deviceOrFrameHandler.removeAllListeners();
      deviceOrFrameHandler.removeAllListeners('receive');
    });
  }

  this.on('send', function(frame) {
    if (self.wrapFrame) {
      var wrappedFrame = self.wrapFrame(_.clone(frame));
      if (self.log) self.log('send wrapped frame: ' + wrappedFrame.toHexDebug());
      deviceOrFrameHandler.send(wrappedFrame);
    } else {
      if (self.log) self.log('send frame: ' + frame.toHexDebug());
      deviceOrFrameHandler.send(frame);
    }
  });

  this.start();
}

util.inherits(FrameHandler, EventEmitter2);

/**
 * Only starts if analyzeNextFrame function is defined.
 * Creates an interval that calls analyzeNextFrame function.
 * @param  {Number}   interval The interval milliseconds. [optional]
 * @param  {Function} callback The function, that will be called when framehandler is started. [optional]
 *                             `function(err){}`
 */
FrameHandler.prototype.start = function(interval, callback) {
  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  if (!this.analyzeNextFrame) {
    if (callback) { callback(null); }
    return;
  }

  if (this.lookupIntervalId) {
    this.stopLookup();
  }

  var self = this;
  interval = interval || 10;

  // recursive nextTick consumes too much cpu!
  // (function run() {
  //   if (!self.isRunning) return;

  //   process.nextTick(function() {
  //     var nextFrame;
  //     while ((nextFrame = self.analyzeNextFrame(self.incomming))) {
  //       if (self.unwrapFrame) {
  //         var unwrappedFrame = self.unwrapFrame(_.clone(nextFrame));
  //         if (self.log) self.log('receive unwrapped frame: ' + unwrappedFrame.toHexDebug());
  //         self.emit('receive', unwrappedFrame);
  //       } else {
  //         if (self.log) self.log('receive frame: ' + nextFrame.toHexDebug());
  //         self.emit('receive', nextFrame);
  //       }
  //     }
  //     run();
  //   });
  // })();

  var analyzing = false;
  this.lookupIntervalId = setInterval(function() {
    if (analyzing) {
      return;
    }

    analyzing = true;
    var nextFrame;
    while ((nextFrame = self.analyzeNextFrame(self.incomming))) {
      if (self.unwrapFrame) {
        var unwrappedFrame = self.unwrapFrame(_.clone(nextFrame));
        if (self.log) self.log('receive unwrapped frame: ' + unwrappedFrame.toHexDebug());
        self.emit('receive', unwrappedFrame);
      } else {
        if (self.log) self.log('receive frame: ' + nextFrame.toHexDebug());
        self.emit('receive', nextFrame);
      }
    }
    analyzing = false;
  }, interval);

  if (callback) { callback(null); }
};

/**
 * Stops the interval that calls analyzeNextFrame function.
 */
FrameHandler.prototype.stop = function() {
  if (this.lookupIntervalId) {
    clearInterval(this.lookupIntervalId);
    this.lookupIntervalId = null;
  }
};

/**
 * The send mechanism.
 * @param  {Array} data A "byte" array.
 */
FrameHandler.prototype.send = function(data) {
  this.emit('send', data);
};

module.exports = FrameHandler;
