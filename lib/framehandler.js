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
                        self.emit('receive', unwrappedFrame);
                    } else {
                        self.emit('receive', nextFrame);
                    }
                }
            } else {
                if (self.unwrapFrame) {
                    unwrappedFrame = self.unwrapFrame(_.clone(frame));
                    self.emit('receive', unwrappedFrame);
                } else {
                    self.emit('receive', frame);
                }
            }
        });

        deviceOrFrameHandler.on('close', function() {
            self.emit('close');
            self.removeAllListeners();
            deviceOrFrameHandler.removeAllListeners();
        });
    }

    this.on('send', function(frame) {
        if (self.wrapFrame) {
            var wrappedFrame = self.wrapFrame(_.clone(frame));
            deviceOrFrameHandler.emit('send', wrappedFrame);
        } else {
            deviceOrFrameHandler.emit('send', frame);
        }
    });
}

util.inherits(FrameHandler, EventEmitter2);

FrameHandler.prototype.send = function(data) {
    this.emit('send', data);
};

module.exports = FrameHandler;