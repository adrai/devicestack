var EventEmitter2 = require('eventemitter2').EventEmitter2
  , util = require('util')
  , _ = require('lodash');

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
        var incomming = [];
        deviceOrFrameHandler.on('receive', function (frame) {
            var unwrappedFrame;
            if (self.analyzeNextFrame) {
                // extract frames, ananylze stuff
                incomming = incomming.concat(Array.prototype.slice.call(frame, 0));
                var nextFrame = null;
                while ((nextFrame = self.analyzeNextFrame(incomming))) {
                    if (self.unwrapFrame) {
                        unwrappedFrame = self.unwrapFrame(_.clone(nextFrame));
                        if (self.log) self.log('receive unwrapped frame: ' + unwrappedFrame.toHexDebug());
                        self.emit('receive', unwrappedFrame);
                    } else {
                        if (self.log) self.log('receive frame: ' + nextFrame.toHexDebug());
                        self.emit('receive', nextFrame);
                    }
                }
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
        });
    }

    this.on('send', function(frame) {
        if (self.wrapFrame) {
            var wrappedFrame = self.wrapFrame(_.clone(frame));
            if (self.log) self.log('send wrapped frame: ' + wrappedFrame.toHexDebug());
            deviceOrFrameHandler.emit('send', wrappedFrame);
        } else {
            if (self.log) self.log('send frame: ' + frame.toHexDebug());
            deviceOrFrameHandler.emit('send', frame);
        }
    });
}

util.inherits(FrameHandler, EventEmitter2);

FrameHandler.prototype.send = function(data) {
    this.emit('send', data);
};

module.exports = FrameHandler;