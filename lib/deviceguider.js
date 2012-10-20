var util = require('util')
  , EventEmitter2 = require('eventemitter2').EventEmitter2
  , _ = require('lodash')
  , async = require('async');

function DeviceGuider(deviceLoader) {
    var self = this;

    // call super class
    EventEmitter2.call(this, {
        wildcard: true,
        delimiter: ':',
        maxListeners: 1000 // default would be 10!
    });

    this.deviceLoader = deviceLoader;
    this.currentState = {
        doAutoconnect: false,
        connectOne: true,
        plugged: [],
        connected: [],
        getDevice: function(id) {
            return _.find(self.currentState.plugged, function(d) {
                return d.id === id;
            });
        },
        getConnection: function(id) {
            return _.find(self.currentState.connected, function(dc) {
                return dc.connection.id === id;
            });
        }
    };

    this.deviceLoader.on('plug', function(device) {
        self.currentState.plugged.push(device);
        self.emit('plug', device);

        if (self.currentState.doAutoconnect) {
            if (!self.currentState.connectOne || self.currentState.connectOne && self.currentState.connected.length === 0) {
                self.connectDevice(device);
            }
        }
    });

    this.deviceLoader.on('unplug', function(device) {
        self.currentState.plugged = _.reject(self.currentState.plugged, function(d) {
            return d.id === device.id;
        });
        self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
            return dc.device.id === device.id;
        });
        self.emit('unplug', device);
    });

    this.deviceLoader.startLookup();
}

util.inherits(DeviceGuider, EventEmitter2);

DeviceGuider.prototype.getCurrentState = function(callback) {
    var self = this;
    
    if (this.currentState.plugged.length > 0) {
        callback(null, this.currentState);
    } else {
        this.deviceLoader.trigger(function(err, devices) {
            callback(null, self.currentState);
        });
    }
};

DeviceGuider.prototype.autoconnect = function() {
    var self = this;

    this.currentState.doAutoconnect = true;
    this.currentState.connectOne = false;

    var toConnect = _.reject(this.currentState.plugged, function(d) {
        return _.find(self.currentState.connected, function(c) {
            return c.device.id == d.id;
        });
    });

    _.each(toConnect, function(dev) {
        self.connectDevice(dev);
    });
};

DeviceGuider.prototype.manualconnect = function(callback) {
    this.currentState.doAutoconnect = false;

    if (this.currentState.connected.length === 0) {
        return callback(null);
    }

    async.forEach(this.currentState.connected, function(dc, clb) {
        dc.connection.close(clb);
    }, callback);
};

DeviceGuider.prototype.autoconnectOne = function(callback) {
    this.currentState.doAutoconnect = true;
    this.currentState.connectOne = true;
    if (this.currentState.plugged.length > 0 && this.currentState.connected.length === 0) {
        this.connectDevice(this.currentState.plugged[0], callback);
    } else {
        if (callback) callback('No device available!');
    }
};

DeviceGuider.prototype.connectDevice = function(device, callback) {
    var self = this;

    device.connect(function(err, connection) {
        if (err) {
            self.emit('error', err);
            if (callback) {
                return callback(err, device, connection);
            }
            return;
        }
        self.currentState.connected.push({ device: device, connection: connection });

        connection.on('disconnect', function(conn) {
            self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
                return dc.connection.id === conn.id;
            });

            self.emit('disconnect', conn.device, conn);
        });

        self.emit('connect', device, connection);

        if (callback) callback(err, device, connection);
    });
};

DeviceGuider.prototype.connect = function(port, callback) {
    this.connectDevice(new this.deviceLoader.Device(port), callback);
};

module.exports = DeviceGuider;