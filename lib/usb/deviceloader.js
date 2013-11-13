var DeviceLoader = require('../deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    async = require('async'),
    monitor;

/**
 * A usbdeviceloader can check if there are available some serial devices.
 * @param {Object}          Device    Device The constructor function of the device.
 * @param {Number || Array} vendorId  The vendor id or an array of vid/pid pairs.
 * @param {Number}          productId The product id or optional.
 */
function UsbDeviceLoader(Device, vendorId, productId) {

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

util.inherits(UsbDeviceLoader, DeviceLoader);

/**
 * Maps the result of monitor.find by the Device objects.
 * @param  {Array} ports Result of monitor.find
 * @return {Array}       Mapped Device Array.
 */
UsbDeviceLoader.prototype.map = function(ports) {
  if (this.filter) {
    ports = this.filter(ports);
  }

  var self = this;

  var devices = _.map(ports, function(p) {
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

  return devices;
};

/**
 * Calls the callback with an array of devices.
 * @param  {Function} callback The function, that will be called when finished lookup.
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
UsbDeviceLoader.prototype.lookup = function(callback) {
  var self = this;
  var result = [];
  async.forEach(this.vidPidPairs, function(pair, callback) {
    monitor.find(this.vendorId, this.productId, function(err, ports) {
      if (err) {
        if (!err.name) {
          err = new Error(err);
        }
        return callback(err);
      }

      var devices = self.map(ports);
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

/**
 * Starts to lookup.
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
UsbDeviceLoader.prototype.startLookup = function(interval, callback) {
  this.isRunning = true;

  if (!monitor) {
    try {
      monitor = require('usb-detection');
    } catch(e) {
      console.log(e.message);
      throw e;
    }
  }

  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  var self = this;

  this.oldDevices = [];

  _.each(this.vidPidPairs, function(pair) {
    monitor.on('add:' + pair.vendorId + ':' + pair.productId, self.addHandle = function(dev) {
      var device = self.map([dev])[0];
      self.oldDevices.push(device);
      if (self.log) self.log('plug device with id ' + device.id);
      self.emit('plug', device);
      self.emit('plugChanged', { state: 'plug', device: device });
    });

    monitor.on('remove:' + pair.vendorId + ':' + pair.productId, self.removeHandle = function(dev) {
      var device = self.map([dev])[0];
      self.oldDevices = _.reject(self.oldDevices, function(d) {
        return d === device;
      });
      if (self.log) self.log('unplug device with id ' + device.id);
      self.emit('unplug', device);
      self.emit('plugChanged', { state: 'unplug', device: device });
    });
  });

  this.trigger(callback);
};

/**
 * Stops the interval that calls trigger function.
 */
UsbDeviceLoader.prototype.stopLookup = function() {
  _.each(this.vidPidPairs, function(pair) {
    monitor.removeListener('add:' + pair.vendorId + ':' + pair.productId, self.addHandle);
    monitor.removeListener('remove:' + pair.vendorId + ':' + pair.productId, self.removeHandle);
  });
  this.isRunning = false;
};

module.exports = UsbDeviceLoader;