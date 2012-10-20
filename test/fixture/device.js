var Device = require('../../index').Device
  , Connection = require('./connection')
  , util = require('util')
  , _ = require('lodash');

function MyDevice(withoutConnection) {
    var Conn = withoutConnection ? null : Connection;
    // call super class
    Device.call(this, Conn);
}

util.inherits(MyDevice, Device);

MyDevice.prototype.open = function(callback) {
    var self = this;

    setTimeout(function() {
        self.emit('open', callback);
        if (!self.connection && callback) callback();
    }, 10);

    this.on('send', function(data) {
        setTimeout(function() {
            self.emit('receive', data);
        }, 5);
    });
};

MyDevice.prototype.close = function(callback, fire) {
    var self = this;

    setTimeout(function() {
        self.emit('close', callback);
        self.removeAllListeners();
        if (callback && (!self.connection || fire)) callback(null);
    }, 10);
};

module.exports = MyDevice;