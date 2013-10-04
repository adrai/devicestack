var sp = require('serialport'),
    _ = require('lodash'),
    async = require('async'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    globalSerialDeviceLoader,
    subscribers = [],
    lookupIntervalId = null,
    isRunning = false;

module.exports = globalSerialDeviceLoader = {

  /**
   * Creates a deviceloader.
   * @param  {Object}   Device The constructor function of the device.
   * @param  {Function} filter The filter function that will filter the needed devices.
   * @return {Object}          Represents a SerialDeviceLoader.
   */
  create: function(Device, filter) {
    var sub = new EventEmitter2({
      wildcard: true,
      delimiter: ':',
      maxListeners: 1000 // default would be 10!
    });
    sub.Device = Device;
    sub.filter = filter;
    sub.oldDevices = [];
    sub.newDevices = [];

    /**
     * Calls the callback with an array of devices.
     * @param  {Array}    ports    When called within this file this are the listed system ports. [optional]
     * @param  {Function} callback The function, that will be called when finished lookup.
     *                             `function(err, devices){}` devices is an array of Device objects.
     */
    sub.lookup = function(ports, callback) {
      if (!callback) {
        callback = ports;
        ports = null;
      }

      if (this.newDevices.length > 0) {
        if (callback) { callback(null, this.newDevices); }
        return;
      } else {
        var self = this;
        globalSerialDeviceLoader.lookup(function(err) {
          if (err && !err.name) {
            err = new Error(err);
          }
          if (callback) { callback(err, self.newDevices); }
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
    sub.trigger = function(callback) {
      var self = this;
      globalSerialDeviceLoader.trigger(function(err) {
        if (err && !err.name) {
          err = new Error(err);
        }
        if (callback) { callback(err, self.newDevices); }
      });
    };

    /**
     * Starts to lookup.
     * @param  {Number}   interval The interval milliseconds. [optional]
     * @param  {Function} callback The function, that will be called when trigger has started. [optional]
     *                             `function(err, devices){}` devices is an array of Device objects.
     */
    sub.startLookup = function(interval, callback) {
      if (!callback && _.isFunction(interval)) {
        callback = interval;
        interval = null;
      }

      subscribers.push(this);

      var self = this;
      if (isRunning) {
        if (callback) { callback(null, self.newDevices); }
        return;
      } else {
        globalSerialDeviceLoader.startLookup(interval, function(err) {
          if (err && !err.name) {
            err = new Error(err);
          }
          if (callback) { callback(err, self.newDevices); }
        });
      }
    };

    /**
     * Removes itself as subscriber.
     * If last stops the interval that calls trigger function.
     */
    sub.stopLookup = function() {
      var self = this;
      if (!isRunning) {
        return;
      } else {
        subscribers = _.reject(function(s) {
          return s === self;
        });
        if (subscribers.length === 0) {
          globalSerialDeviceLoader.stopLookup();
        }
        return;
      }
    };

    return sub;
  },

  /**
   * Calls the callback when finished.
   * @param  {Function} callback The function, that will be called when finished lookup.
   *                             `function(err){}`
   */
  lookup: function(callback) {
    sp.list(function(err, ports) {
      if (err && !err.name) {
        err = new Error(err);
      }
      if (err && callback) { return callback(err); }

      async.forEach(subscribers, function(s, callback) {
        if (s) {
          var resPorts = s.filter(ports);

          var devices = _.map(resPorts, function(p) {
            var found = _.find(s.oldDevices, function(dev) {
              return dev.get('portName') && p.comName && dev.get('portName').toLowerCase() === p.comName.toLowerCase();
            });
            if (found) {
              return found;
            } else {
              var newDev = new s.Device(p.comName);
              newDev.set(p);
              return newDev;
            }
          }) || [];

          s.newDevices = devices;
        }

        callback(null);
      }, function(err) {
        if (err && !err.name) {
          err = new Error(err);
        }
        if (callback) { return callback(err); }
      });
    });
  },

  /**
   * Calls lookup function with optional callback
   * and emits 'plug' for new attached devices
   * and 'unplug' for removed devices.
   * @param  {Function} callback The function, that will be called when finished triggering. [optional]
   *                             `function(err){}`
   */
  trigger: function(callback) {
    globalSerialDeviceLoader.lookup(function(err) {
      if (err && !err.name) {
        err = new Error(err);
      }
      if (err && callback) { return callback(err); }

      async.forEach(subscribers, function(s, callback) {
        if (s && s.oldDevices.length !== s.newDevices.length) {
          var devs = [];
          if (s.oldDevices.length > s.newDevices.length) {
            devs = _.difference(s.oldDevices, s.newDevices);
            _.each(devs, function(d) {
              if (s.log) s.log('unplug device with id ' + device.id);
              if (d.close) {
                d.close();
              }
              s.emit('unplug', d);
            });
          } else {
            devs = _.difference(s.newDevices, s.oldDevices);
            _.each(devs, function(d) {
              if (s.log) s.log('plug device with id ' + device.id);
              s.emit('plug', d);
            });
          }

          s.oldDevices = s.newDevices;
        }

        callback(null);
      }, function(err) {
        if (err && !err.name) {
          err = new Error(err);
        }
        if (callback) { return callback(err); }
      });

    });
  },

  /**
   * Starts to lookup.
   * @param  {Number}   interval The interval milliseconds. [optional]
   * @param  {Function} callback The function, that will be called when trigger has started. [optional]
   *                             `function(err){}`
   */
  startLookup: function(interval, callback) {
    if (lookupIntervalId) {
      return;
    }

    isRunning = true;

    if (!callback && _.isFunction(interval)) {
      callback = interval;
      interval = null;
    }

    interval = interval || 500;

    globalSerialDeviceLoader.trigger(function(err) {
      var triggering = false;
      lookupIntervalId = setInterval(function() {
        if (triggering) return;
        triggering = true;
        globalSerialDeviceLoader.trigger(function() {
          triggering = false;
        });
      }, interval);

      if (err && !err.name) {
        err = new Error(err);
      }
      if (callback) { callback(err); }
    });
  },

  /**
   * Stops the interval that calls trigger function.
   */
  stopLookup: function() {
    if (lookupIntervalId) {
      clearInterval(lookupIntervalId);
      lookupIntervalId = null;
      isRunning = false;
    }
  }

};