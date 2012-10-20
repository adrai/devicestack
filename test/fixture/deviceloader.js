var DeviceLoader = require('../../index').DeviceLoader
  , util = require('util')
  , _ = require('lodash')
  , Device = require('./device');

function MyDeviceLoader() {
    var self = this;

    // call super class
    DeviceLoader.call(this);

    this.startDevices = [
        new Device(),
        new Device()
    ];
}

util.inherits(MyDeviceLoader, DeviceLoader);

MyDeviceLoader.prototype.lookup = function(callback) {
    var devices = this.startDevices;
    try {
        this.emit('lookup');
    } catch(e) {
    }
    callback(null, devices);
};

module.exports = new MyDeviceLoader();