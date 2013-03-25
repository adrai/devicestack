var monitor = require("usb-detection"),
    DeviceLoader = require('../deviceloader'),
    util = require('util'),
    _ = require('lodash');

/**
 * A usbdeviceloader can check if there are available some serial devices.
 * @param {Object} Device The constructor function of the device.
 */
function UsbDeviceLoader(Device, vendorId, productId) {

  // call super class
  DeviceLoader.call(this);

  this.Device = Device;

  this.vendorId = vendorId;
  this.productId = productId;
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
  monitor.find(this.vendorId, this.productId, function(err, ports) {
    if (err) { return callback(err); }

    var devices = self.map(ports);

    callback(null, devices);
  });
};

/**
 * Starts to lookup.
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
UsbDeviceLoader.prototype.startLookup = function(interval, callback) {
  this.isRunning = true;

  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  var self = this;

  this.oldDevices = [];

  monitor.on('add' + this.vendorId + ':' + this.productId, this.addHandle = function(dev) {
    var device = self.map([dev])[0];
    self.oldDevices.push(device);
    if (self.log) self.log('plug device with id ' + device.id);
    self.emit('plug', device);
  });

  monitor.on('remove' + this.vendorId + ':' + this.productId, this.removeHandle = function(dev) {
    var device = self.map([dev])[0];
    self.oldDevices = _.reject(self.oldDevices, function(d) {
      return d === device;
    });
    if (self.log) self.log('unplug device with id ' + device.id);
    self.emit('unplug', device);
  });
  
  this.trigger(callback);
};

/**
 * Stops the interval that calls trigger function.
 */
UsbDeviceLoader.prototype.stopLookup = function() {
  monitor.removeListener('add' + this.vendorId + ':' + this.productId, this.addHandle);
  monitor.removeListener('remove' + this.vendorId + ':' + this.productId, this.removeHandle);
  this.isRunning = false;
};

module.exports = UsbDeviceLoader;