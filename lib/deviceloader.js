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
                    self.emit('unplug', d);
                });
            } else {
                devs = _.difference(devices, self.oldDevices);
                _.each(devs, function(d) {
                    self.emit('plug', d);
                });
            }

            self.oldDevices = devices;
        }
        if (callback) callback(err, devices);
    });
};

DeviceLoader.prototype.startLookup = function(interval) {
    if (this.lookupIntervalId) {
        this.stopLookup();
    }

    var self = this;
    interval = interval || 300;

    this.oldDevices = [];
    this.lookupIntervalId = setInterval(function() {
        self.trigger();
    }, interval);
};

DeviceLoader.prototype.stopLookup = function() {
    if (this.lookupIntervalId) {
        clearInterval(this.lookupIntervalId);
        this.lookupIntervalId = null;
    }
};

module.exports = DeviceLoader;