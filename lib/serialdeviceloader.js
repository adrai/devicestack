var sp = require("serialport")
  , DeviceLoader = require('./deviceloader')
  , util = require('util')
  , _ = require('lodash');

/**
 * A serialdeviceloader can check if there are available some serial devices.
 * @param {Object} Device The constructor function of the device.
 */
function SerialDeviceLoader(Device) {
    var self = this;

    // call super class
    DeviceLoader.call(this);

    this.Device = Device;
}

util.inherits(SerialDeviceLoader, DeviceLoader);

/**
 * Calls the callback with an array of devices.
 * @param  {Function} callback The function, that will be called when finished lookup.
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
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