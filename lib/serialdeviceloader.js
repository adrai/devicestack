var sp = require("serialport")
  , DeviceLoader = require('./deviceloader')
  , util = require('util')
  , _ = require('lodash');

function SerialDeviceLoader(Device) {
    var self = this;

    // call super class
    DeviceLoader.call(this);

    this.Device = Device;
}

util.inherits(SerialDeviceLoader, DeviceLoader);

SerialDeviceLoader.prototype.lookup = function(callback) {
    var self = this;
    sp.list(function(err, ports) {
        if (err) { return callback(err); }

        var resPorts = self.filter(ports);

        var devices = _.map(resPorts, function(p) {
            return new self.Device(p.comName);
        }) || [];

        callback(null, devices);
    });
};

module.exports = SerialDeviceLoader;