var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash');

/**
 * A deviceloader can check if there are available some devices.
 */
function DeviceLoader() {
  var self = this;

  // call super class
  EventEmitter2.call(this, {
    wildcard: true,
    delimiter: ':',
    maxListeners: 1000 // default would be 10!
  });

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (DeviceLoader.prototype.log) {
    DeviceLoader.prototype.log = _.wrap(DeviceLoader.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = DeviceLoader.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }

  this.lookupIntervalId = null;
  this.oldDevices = [];

  this.isRunning = false;
}

util.inherits(DeviceLoader, EventEmitter2);

/**
 * Calls lookup function with optional callback
 * and emits 'plug' for new attached devices
 * and 'unplug' for removed devices.
 * @param  {Function} callback The function, that will be called when finished triggering. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
DeviceLoader.prototype.trigger = function(callback) {
  var self = this;
  this.lookup(function(err, devices) {
    if (err) {
      if (self.log) self.log(err);
      if (!err.name) {
        err = new Error(err);
      }
      if (callback) callback(err, devices);
      return;
    }

    var remDevs = _.difference(self.oldDevices, devices);
    _.each(remDevs, function(d) {
      if (self.log) self.log('unplug device with id ' + d.id);
      if (d.close) {
        d.close();
      }
      self.emit('unplug', d);
      self.emit('plugChanged', { state: 'unplug', device: d });
    });

    var addDevs = _.difference(devices, self.oldDevices);
    _.each(addDevs, function(d) {
      if (self.log) self.log('plug device with id ' + d.id);
      self.emit('plug', d);
      self.emit('plugChanged', { state: 'plug', device: d });
    });

    self.oldDevices = devices;
    if (callback) callback(null, devices);
  });
};

/**
 * Starts to lookup.
 * @param  {Number}   interval The interval milliseconds. [optional]
 * @param  {Function} callback The function, that will be called when trigger has started. [optional]
 *                             `function(err, devices){}` devices is an array of Device objects.
 */
DeviceLoader.prototype.startLookup = function(interval, callback) {
  if (this.lookupIntervalId) {
    this.stopLookup();
  }

  this.isRunning = true;

  if (!callback && _.isFunction(interval)) {
    callback = interval;
    interval = null;
  }

  var self = this;
  interval = interval || 500;

  this.oldDevices = [];
  this.trigger(function(err, devices) {
    var triggering = false;
    self.lookupIntervalId = setInterval(function() {
      if (triggering) return;
      triggering = true;
      self.trigger(function() {
        triggering = false;
      });
    }, interval);

    if (err && !err.name) {
      err = new Error(err);
    }

    if (callback) { callback(err, devices); }
  });
};

/**
 * Stops the interval that calls trigger function.
 */
DeviceLoader.prototype.stopLookup = function() {
  if (this.lookupIntervalId) {
    clearInterval(this.lookupIntervalId);
    this.lookupIntervalId = null;
    this.isRunning = false;
  }
};

module.exports = DeviceLoader;
