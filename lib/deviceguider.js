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

    if (this.log) {
        this.log = _.wrap(this.log, function(func, msg) {
            func(self.constructor.name + ': ' + msg);
        });
    }

    this.deviceLoader = deviceLoader;
    this.currentState = {
        connectionMode: {
            doAutoconnect: false,
            connectOne: true
        },
        plugged: [],
        connected: [],
        getDevice: function(id) {
            return _.find(self.currentState.plugged, function(d) {
                return d.id === id;
            });
        },
        getConnection: function(id) {
            var found = _.find(self.currentState.connected, function(dc) {
                return dc.connection.id === id;
            });

            return found ? found.connection : null;
        },
        getDeviceByPort: function(port) {
            return _.find(self.currentState.plugged, function(d) {
                return d.get('portName') === port;
            });
        },
        getConnectedDevice: function(id) {
            return _.find(self.currentState.connected, function(dc) {
                return dc.id === id;
            });
        },
        getConnectedDeviceByPort: function(id) {
            return _.find(self.currentState.connected, function(dc) {
                return dc.get('portName') === port;
            });
        },
        getDeviceByConnection: function(id) {
            return _.find(self.currentState.connected, function(dc) {
                return dc.connection.id === id;
            });
        },
        getConnectionByDevice: function(id) {
            var found =  _.find(self.currentState.connected, function(dc) {
                return dc.id === id;
            });

            return found ? found.connection : null;
        }
    };

    this.deviceLoader.on('plug', function(device) {
        self.currentState.plugged.push(device);

        if (self.log) self.log('plug device with id ' + device.id);
        self.emit('plug', device);

        if (self.currentState.connectionMode.doAutoconnect) {
            if (!self.currentState.connectionMode.connectOne || self.currentState.connectionMode.connectOne && self.currentState.connected.length === 0) {
                self.connectDevice(device);
            }
        }
    });

    this.deviceLoader.on('unplug', function(device) {
        self.currentState.plugged = _.reject(self.currentState.plugged, function(d) {
            return d.id === device.id;
        });
        self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
            return dc.id === device.id;
        });

        if (self.log) self.log('unplug device with id ' + device.id);
        self.emit('unplug', device);
    });

    this.deviceLoader.startLookup();
}

util.inherits(DeviceGuider, EventEmitter2);

DeviceGuider.prototype.changeConnectionMode = function(data) {
    var doAutoconnect
      , connectOne;

    if (arguments.length === 2) {
        if (arguments[0] === 'doAutoconnect') { doAutoconnect = arguments[1]; }
        if (arguments[0] === 'connectOne') { connectOne = arguments[1]; }
    } else {
        if (data.doAutoconnect !== undefined) doAutoconnect = data.doAutoconnect;
        if (data.connectOne !== undefined) connectOne = data.connectOne;
    }

    var somethingChanged = false;

    if (doAutoconnect !== undefined) {
        somethingChanged = somethingChanged ? somethingChanged : this.currentState.connectionMode.doAutoconnect !== doAutoconnect;
        this.currentState.connectionMode.doAutoconnect = doAutoconnect;
    }

    if (connectOne !== undefined) {
        somethingChanged = somethingChanged ? somethingChanged : this.currentState.connectionMode.connectOne !== connectOne;
        this.currentState.connectionMode.connectOne = connectOne;
    }

    if (somethingChanged) {
        this.emit('connectionModeChanged', this.currentState.connectionMode);
    }

    return somethingChanged;
};

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

    if (this.changeConnectionMode({ doAutoconnect: true, connectOne: false })) {
        var toConnect = _.reject(this.currentState.plugged, function(d) {
            return _.find(self.currentState.connected, function(c) {
                return c.id == d.id;
            });
        });

        _.each(toConnect, function(dev) {
            self.connectDevice(dev);
        });
    }
};

DeviceGuider.prototype.manualconnect = function(callback) {
    var self = this;

    if (this.changeConnectionMode('doAutoconnect', false)) {
        if (this.currentState.connected.length === 0) {
            if (callback) { return callback(null); }
        }

        async.forEach(this.currentState.connected, function(dc, clb) {
            self.closeConnection(dc.connection, clb);
        }, function(err) {
            if (callback) { return callback(err); }
        });
    } else {
        if (callback) { return callback(null); }
    }
};

DeviceGuider.prototype.autoconnectOne = function(callback) {
    if (this.changeConnectionMode({ doAutoconnect: true, connectOne: true })) {
        if (this.currentState.plugged.length > 0 && this.currentState.connected.length === 0) {
            this.connectDevice(this.currentState.plugged[0], callback);
        } else {
            if (callback) callback('No device available!');
        }
    } else {
        if (callback) { return callback(null); }
    }
};

DeviceGuider.prototype.connectDevice = function(deviceOrId, callback) {
    var self = this
      , device = deviceOrId;

    if (_.isString(deviceOrId)) {
        device = this.currentState.getDevice(deviceOrId);
    }

    device.connect(function(err, connection) {
        if (err) {
            if (self.log) self.log('error calling connect' + JSON.stringify(err));
            self.emit('error', err);
            if (callback) {
                return callback(err, connection);
            }
            return;
        }
        self.currentState.connected.push(device);

        connection.on('disconnect', function(conn) {
            self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
                return dc.connection.id === conn.id;
            });

            if (self.log) self.log('disconnect device with id ' + conn.device.id + ' and connection id ' + conn.id);
            self.emit('disconnect', conn);
        });

        if (self.log) self.log('connect device with id ' + device.id + ' and connection id ' + connection.id);
        self.emit('connect', connection);

        if (callback) callback(err, connection);
    });
};

DeviceGuider.prototype.connect = function(port, callback) {
    this.connectDevice(new this.deviceLoader.Device(port), callback);
};

DeviceGuider.prototype.disconnect = function(port, callback) {
    var device = this.currentState.getConnectedDeviceByPort(port);
    this.disconnectDevice(device, callback);
};

DeviceGuider.prototype.disconnectDevice = function(deviceOrId, callback) {
    var self = this
      , device = deviceOrId;

    if (_.isString(deviceOrId)) {
        device = this.currentState.getConnectedDevice(deviceOrId);
    }

    if (!device) {
        if (this.log) this.log('Device not connected!');
        self.emit('error', 'Device not connected!');
        if (callback) { return callback('Device not connected!'); }
    }

    device.disconnect(function(err) {
        if (err) {
            if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
            self.emit('error', err);
            if (callback) {
                return callback(err, device.connection);
            }
            return;
        }

        if (callback) callback(err, device.connection);
    });
};

DeviceGuider.prototype.closeConnection = function(connectionOrId, callback) {
    var self = this
      , connection = connectionOrId;

    if (_.isString(connectionOrId)) {
        connection = this.currentState.getConnection(connectionOrId);
    }

    connection.close(function(err) {
        if (err) {
            if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
            self.emit('error', err);
            if (callback) {
                return callback(err, connection);
            }
            return;
        }

        if (callback) callback(err, connection);
    });
};

module.exports = DeviceGuider;