var SerialDeviceLoader = require('./deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    monitor;

/**
 * An EventedSerialDeviceLoader can check if there are available some serial devices.
 * @param {Object} Device    Device The constructor function of the device.
 * @param {Number} vendorId  The vendor id.
 * @param {Number} productId The product id.
 */
function EventedSerialDeviceLoader(Device, vendorId, productId) {

  // call super class
  SerialDeviceLoader.call(this, Device, false);

  this.vendorId = vendorId;
  this.productId = productId;
}

util.inherits(EventedSerialDeviceLoader, SerialDeviceLoader);

/**
 * Starts to lookup.
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
EventedSerialDeviceLoader.prototype.startLookup = function(interval, callback) {
  this.isRunning = true;

  if (!monitor) {
    monitor = require('usb-detection');
  }

  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  var self = this;
  interval = interval || 500;

  this.oldDevices = [];

  monitor.on('add:' + this.vendorId + ':' + this.productId, this.addHandle = function(dev) {
    var isTriggering = false;
    var intervalId = setInterval(function() {
      if (isTriggering) {
        return;
      }
      isTriggering = true;

      self.once('plug', function() {
        clearInterval(intervalId);
      });
      self.trigger(function() {
        isTriggering = false;
      });
    }, interval);
  });

  monitor.on('remove:' + this.vendorId + ':' + this.productId, this.removeHandle = function(dev) {
    self.trigger();
  });

  this.trigger(callback);
};

/**
 * Stops the interval that calls trigger function.
 */
EventedSerialDeviceLoader.prototype.stopLookup = function() {
  monitor.removeListener('add:' + this.vendorId + ':' + this.productId, this.addHandle);
  monitor.removeListener('remove:' + this.vendorId + ':' + this.productId, this.removeHandle);
  this.isRunning = false;
};

module.exports = EventedSerialDeviceLoader;