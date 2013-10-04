var ftdi = require("ftdi"),
    DeviceLoader = require('../deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    async = require('async');

/**
 * An FtdiDeviceLoader can check if there are available some ftdi devices.
 * @param {Object}          Device    Device The constructor function of the device.
 * @param {Number || Array} vendorId  The vendor id or an array of vid/pid pairs.
 * @param {Number}          productId The product id or optional.
 */
function FtdiDeviceLoader(Device, vendorId, productId) {

  // call super class
  DeviceLoader.call(this);

  this.Device = Device;

  this.vidPidPairs = [];

  if (!productId && _.isArray(vendorId)) {
    this.vidPidPairs = vendorId;
  } else {
    this.vidPidPairs = [{vendorId: vendorId, productId: productId}];
  }
}

util.inherits(FtdiDeviceLoader, DeviceLoader);

/**
 * Calls the callback with an array of devices.
 * @param  {Function} callback The function, that will be called when finished lookup.
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
FtdiDeviceLoader.prototype.lookup = function(callback) {
  var self = this;

  var result = [];
  async.forEach(this.vidPidPairs, function(pair, callback) {
    ftdi.find(pair.vendorId, pair.productId, function(err, ports) {
      if (err) {
        if (!err.name) {
          err = new Error(err);
        }
        return callback(err);
      }

      var resPorts = ports;
      if (self.filter) {
        resPorts = self.filter(ports);
      }

      var devices = _.map(resPorts, function(p) {
        var found = _.find(self.oldDevices, function(dev) {
          return dev.get('locationId') === p.locationId &&
                 dev.get('vendorId') === p.vendorId &&
                 dev.get('productId') === p.productId &&
                 dev.get('serialNumber') === p.serialNumber;
        });
        if (found) {
          return found;
        } else {
          return new self.Device(p);
        }
      }) || [];

      result = result.concat(devices);
      callback(null);
    });
  }, function(err) {
    if (err && !err.name) {
      err = new Error(err);
    }
    callback(err, result);
  });
};

module.exports = FtdiDeviceLoader;