var FtdiDeviceLoader = require('./deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    monitor;

/**
 * An FtdiDeviceLoader can check if there are available some ftdi devices.
 * @param {Object}          Device    Device The constructor function of the device.
 * @param {Number || Array} vendorId  The vendor id or an array of vid/pid pairs.
 * @param {Number}          productId The product id or optional.
 */
function EventedFtdiDeviceLoader(Device, vendorId, productId) {

  // call super class
  FtdiDeviceLoader.call(this, Device, vendorId, productId);
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
  interval = interval || 500;

  this.oldDevices = [];

  _.each(this.vidPidPairs, function(pair) {
    monitor.on('add:' + pair.vendorId + ':' + pair.productId, self.addHandle = function(dev) {
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

    monitor.on('remove:' + pair.vendorId + ':' + pair.productId, self.removeHandle = function(dev) {
      self.trigger();
    });
  });

  this.trigger(callback);
};

/**
 * Stops the interval that calls trigger function.
 */
EventedFtdiDeviceLoader.prototype.stopLookup = function() {
  _.each(this.vidPidPairs, function(pair) {
    monitor.removeListener('add:' + pair.vendorId + ':' + pair.productId, self.addHandle);
    monitor.removeListener('remove:' + pair.vendorId + ':' + pair.productId, self.removeHandle);
  });
  this.isRunning = false;
};

module.exports = EventedFtdiDeviceLoader;