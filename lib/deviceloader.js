var EventEmitter2 = require('eventemitter2').EventEmitter2
  , util = require('util')
  , _ = require('lodash');

function DeviceLoader() {
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
    }

    this.lookupIntervalId = null;
    this.oldDevices = [];
}

util.inherits(DeviceLoader, EventEmitter2);

DeviceLoader.prototype.trigger = function(callback) {
    var self = this;
    this.lookup(function(err, devices) {
        if (self.oldDevices.length !== devices.length) {
            var devs = [];
            if (self.oldDevices.length > devices.length) {
                devs = _.difference(self.oldDevices, devices);
                _.each(devs, function(d) {
                    if (self.log) self.log('unplug device with id ' + device.id);
                    self.emit('unplug', d);
                });
            } else {
                devs = _.difference(devices, self.oldDevices);
                _.each(devs, function(d) {
                    if (self.log) self.log('plug device with id ' + device.id);
                    self.emit('plug', d);
                });
            }

            self.oldDevices = devices;
        }
        if (callback) callback(err, devices);
    });
};

DeviceLoader.prototype.startLookup = function(interval, callback) {
    if (this.lookupIntervalId) {
        this.stopLookup();
    }

    if (!callback && _.isFunction(interval)) {
        callback = interval;
        interval = null;
    }

    var self = this;
    interval = interval || 250;

    this.oldDevices = [];
    this.trigger(function(err, devices) {
        self.lookupIntervalId = setInterval(function() {
            self.trigger();
        }, interval);

        if (callback) { callback(err, devices); }
    });
};

DeviceLoader.prototype.stopLookup = function() {
    if (this.lookupIntervalId) {
        clearInterval(this.lookupIntervalId);
        this.lookupIntervalId = null;
    }
};

module.exports = DeviceLoader;