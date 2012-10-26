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

    this.start();
}

util.inherits(FrameHandler, EventEmitter2);

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
    interval = interval || 50;

    var analyzing = false;
    this.lookupIntervalId = setInterval(function() {
        if (analyzing) {
            return;
        }

        analyzing = true;
        var nextFrame;
        while ((nextFrame = self.analyzeNextFrame(self.incomming))) {
            if (self.unwrapFrame) {
                unwrappedFrame = self.unwrapFrame(_.clone(nextFrame));
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

FrameHandler.prototype.stop = function() {
    if (this.lookupIntervalId) {
        clearInterval(this.lookupIntervalId);
        this.lookupIntervalId = null;
    }
};

FrameHandler.prototype.send = function(data) {
    this.emit('send', data);
};

module.exports = FrameHandler;