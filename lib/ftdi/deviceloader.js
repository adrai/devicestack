var ftdi = require("ftdi"),
    DeviceLoader = require('../deviceloader'),
    util = require('util'),
    _ = require('lodash');

/**
 * A ftdideviceloader can check if there are available some serial devices.
 * @param {Object} Device The constructor function of the device.
 */
function FtdiDeviceLoader(Device, vendorId, productId) {

  // call super class
  DeviceLoader.call(this);

  this.Device = Device;

  this.vendorId = vendorId;
  this.productId = productId;
}

util.inherits(FtdiDeviceLoader, DeviceLoader);

/**
 * Calls the callback with an array of devices.
 * @param  {Function} callback The function, that will be called when finished lookup.
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
FtdiDeviceLoader.prototype.lookup = function(callback) {
  var self = this;
  ftdi.find(this.vendorId, this.productId, function(err, ports) {
    if (err) { return callback(err); }

    var resPorts = ports;
    if (self.filter) {
      resPorts = self.filter(ports);
    }

    var devices = _.map(resPorts, function(p) {
      var found = _.find(self.oldDevices, function(dev) {
        return dev.get('deviceSettings').locationId === p.locationId &&
               dev.get('deviceSettings').vendorId === p.vendorId &&
               dev.get('deviceSettings').productId === p.productId &&
               dev.get('deviceSettings').serial === p.serial;
      });
      if (found) {
        return found;
      } else {
        return new self.Device(p);
      }
    }) || [];

    callback(null, devices);
  });
};

module.exports = FtdiDeviceLoader;