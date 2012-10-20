var EventEmitter2 = require('eventemitter2').EventEmitter2
  , util = require('util')
  , uuid = require('node-uuid').v4;

function Connection(device) {
    var self = this;

    // call super class
    EventEmitter2.call(this, {
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    });

    this.id = uuid();
    this.device = device;

    this.device.on('open', this.openHandle = function(callback) {
        self.emit('connecting', self);
        if (self.onConnecting) {
            self.onConnecting(function() {
                self.emit('connect', self);
                if (callback) callback(null, self);
            });
        } else {
            self.emit('connect', self);
            if (callback) callback(null, self);
        }
    });

    this.device.on('closing', this.openingHandle = function(callback) {
        self.close(callback);
    });

    this.device.on('close', this.closeHandle = function(callback) {
        self.emit('disconnect', self);
        self.removeAllListeners();
        self.removeAllListeners('connect');
        self.removeAllListeners('connecting');
        self.removeAllListeners('disconnect');
        self.removeAllListeners('disconnecting');
        self.device.removeListener('open', self.openHandle);
        self.device.removeListener('opening', self.openingHandle);
        // if (callback) callback(null, self);
    });
}

util.inherits(Connection, EventEmitter2);

Connection.prototype.close = function(callback) {
    var self = this;
    this.emit('disconnecting', this);
    if (this.onDisconnecting) {
        this.onDisconnecting(function() {
            self.device.close(callback, true);
        });
    } else {
        this.device.close(callback, true);
    }
};

module.exports = Connection;