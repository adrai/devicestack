var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash'),
    async = require('async');

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
  } else if (FrameHandler.prototype.log) {
    FrameHandler.prototype.log = _.wrap(FrameHandler.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = FrameHandler.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }

  this.analyzeInterval = 20;

  if (deviceOrFrameHandler) {
    this.incomming = [];
    deviceOrFrameHandler.on('receive', function (frame) {
      var unwrappedFrame;
      if (self.analyzeNextFrame) {
        self.incomming = self.incomming.concat(Array.prototype.slice.call(frame, 0));
        self.trigger();
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
      self.emit('close');
      self.removeAllListeners();
      deviceOrFrameHandler.removeAllListeners();
      deviceOrFrameHandler.removeAllListeners('receive');
      self.incomming = [];
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
}

util.inherits(FrameHandler, EventEmitter2);

/**
 * Analyzes the incomming data.
 */
FrameHandler.prototype.analyze = function() {
  
  try {
    if (this.incomming.length === 0) return;

    var nextFrame;
    while ((nextFrame = this.analyzeNextFrame(this.incomming)) && nextFrame.length) {
      if (this.unwrapFrame) {
        var unwrappedFrame = this.unwrapFrame(_.clone(nextFrame));
        if (this.log) this.log('receive unwrapped frame: ' + unwrappedFrame.toHexDebug());
        this.emit('receive', unwrappedFrame);
      } else {
        if (this.log) this.log('receive frame: ' + nextFrame.toHexDebug());
        this.emit('receive', nextFrame);
      }
    }
  } catch(err) {
    this.isAnalyzing = false;
    this.trigger();
    throw err;
  }
};

/**
 * Triggers for analyzing incomming bytes.
 */
FrameHandler.prototype.trigger = function() {

  if (this.isAnalyzing || this.incomming.length === 0) return;

  this.isAnalyzing = true;

  this.analyze();

  if (this.incomming.length === 0) {
    this.isAnalyzing = false;
    return;
  }

  var self = this;

  async.whilst(
    function() {
      return self.incomming.length > 0;
    },
    function(callback) {
      setTimeout(function() {
        self.analyze();
        callback(null);
      },  self.analyzeInterval);
    }, function(err) {
      self.isAnalyzing = false;
    }
  );
  
};

/**
 * The send mechanism.
 * @param  {Array} data A "byte" array.
 */
FrameHandler.prototype.send = function(data) {
  this.emit('send', data);
};

module.exports = FrameHandler;