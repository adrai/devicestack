var FtdiDeviceLoader = require('./deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    monitor;

/**
 * A usbdeviceloader can check if there are available some serial devices.
 * @param {Object} Device The constructor function of the device.
 */
function EventedFtdiDeviceLoader(Device, vendorId, productId) {

  // call super class
  FtdiDeviceLoader.call(this);

  this.Device = Device;

  this.vendorId = vendorId;
  this.productId = productId;
}

util.inherits(EventedFtdiDeviceLoader, FtdiDeviceLoader);

/**
 * Starts to lookup.
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
EventedFtdiDeviceLoader.prototype.startLookup = function(interval, callback) {
  this.isRunning = true;

  if (!monitor) {
    monitor = require('usb-detection');
  }

  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  var self = this;

  this.oldDevices = [];

  monitor.on('change:' + this.vendorId + ':' + this.productId, this.changeHandle = function(dev) {
    self.trigger();
  });

  this.trigger(callback);
};

/**
 * Stops the interval that calls trigger function.
 */
EventedFtdiDeviceLoader.prototype.stopLookup = function() {
  monitor.removeListener('change:' + this.vendorId + ':' + this.productId, this.changeHandle);
  this.isRunning = false;
};

module.exports = EventedFtdiDeviceLoader;