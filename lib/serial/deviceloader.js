var sp = require('serialport'),
    DeviceLoader = require('../deviceloader'),
    util = require('util'),
    _ = require('lodash'),
    globalSerialDeviceLoader = require('./globaldeviceloader');

/**
 * A serialdeviceloader can check if there are available some serial devices.
 * @param {Object} Device The constructor function of the device.
 */
function SerialDeviceLoader(Device, useGlobal) {

  // call super class
  DeviceLoader.call(this);

  this.Device = Device;

  this.useGlobal = (useGlobal === undefined || useGlobal === null) ? true : useGlobal;

  if (this.useGlobal) {
    this.globalSerialDeviceLoader = globalSerialDeviceLoader.create(Device, this.filter);
  }
}

util.inherits(SerialDeviceLoader, DeviceLoader);

/* Override of EventEmitter. */
SerialDeviceLoader.prototype.on = function(eventname, callback) {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.on.apply(this.globalSerialDeviceLoader, _.toArray(arguments));
  } else {
    DeviceLoader.prototype.on.apply(this, _.toArray(arguments));
  }
};

/* Override of EventEmitter. */
SerialDeviceLoader.prototype.removeListener = function(eventname, callback) {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.removeListener.apply(this.globalSerialDeviceLoader, _.toArray(arguments));
  } else {
    DeviceLoader.prototype.removeListener.apply(this, _.toArray(arguments));
  }
};

/* Same as removeListener */
SerialDeviceLoader.prototype.off = SerialDeviceLoader.prototype.removeListener;

/**
 * Calls the callback with an array of devices.
 * @param  {Function} callback The function, that will be called when finished lookup.
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
SerialDeviceLoader.prototype.lookup = function(callback) {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.lookup(callback);
  } else {
    var self = this;
    sp.list(function(err, ports) {
      if (err) {
        if (!err.name) {
          err = new Error(err);
        }
        return callback(err);
      }

      var resPorts = self.filter(ports);

      var devices = _.map(resPorts, function(p) {
        var found = _.find(self.oldDevices, function(dev) {
          return dev.get('portName') && p.comName && dev.get('portName').toLowerCase() === p.comName.toLowerCase();
        });

        if (found) {
          return found;
        } else {
          var newDev = new self.Device(p.comName);
          newDev.set(p);
          return newDev;
        }
      }) || [];

      callback(null, devices);
    });
  }
};

/**
 * Calls lookup function with optional callback
 * and emits 'plug' for new attached devices
 * and 'unplug' for removed devices.
 * @param  {Function} callback The function, that will be called when finished triggering. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
SerialDeviceLoader.prototype.trigger = function(callback) {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.trigger(callback);
  } else {
    DeviceLoader.prototype.trigger.apply(this, _.toArray(arguments));
  }
};

/**
 * Starts to lookup.
 * @param  {Number}   interval The interval milliseconds. [optional]
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
SerialDeviceLoader.prototype.startLookup = function(interval, callback) {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.startLookup(interval, callback);
  } else {
    DeviceLoader.prototype.startLookup.apply(this, _.toArray(arguments));
  }
};

/**
 * Stops the interval that calls trigger function.
 */
SerialDeviceLoader.prototype.stopLookup = function() {
  if (this.useGlobal) {
    this.globalSerialDeviceLoader.stopLookup();
  } else {
    DeviceLoader.prototype.stopLookup.apply(this, _.toArray(arguments));
  }
};

module.exports = SerialDeviceLoader;