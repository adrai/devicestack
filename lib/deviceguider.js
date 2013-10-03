var util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    _ = require('lodash'),
    async = require('async');

/**
 * A deviceguider emits 'plug' for new attached devices,
 * 'unplug' for removed devices, emits 'connect' for connected devices
 * and emits 'disconnect' for disconnected devices.
 * Emits 'connecting' and 'disconnecting' with device object.
 * Emits 'connectionStateChanged' with state and connection or device.
 * @param {DeviceLoader} deviceLoader The deviceloader object.
 */
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

  this.deviceErrorSubscriptions = {};
  this.deviceLoader = deviceLoader;
  this.lookupStarted = false;
  this.currentState = {
    connectionMode: 'manualconnect',
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
    getConnectedDevice: function(id) {
      return _.find(self.currentState.connected, function(dc) {
        return dc.id === id;
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

  var connecting = false;

  this.deviceLoader.on('plug', function(device) {

    self.deviceErrorSubscriptions[device.id] = function(err) {
      self.emit('error', err);
    };
    device.on('error', self.deviceErrorSubscriptions[device.id]);

    self.currentState.plugged.push(device);

    if (self.log) self.log('plug device with id ' + device.id);
    self.emit('plug', device);

    if (self.currentState.connectionMode !== 'manualconnect') {
      if (self.currentState.connectionMode === 'autoconnect' || self.currentState.connectionMode === 'autoconnectOne' && self.currentState.connected.length === 0) {
        if (!connecting) {
          self.connectDevice(device, function() {
            connecting = false;
          });
          connecting = true;
        }
      }
    }
  });

  this.deviceLoader.on('unplug', function(device) {
    device.removeListener('error', self.deviceErrorSubscriptions[device.id]);
    delete self.deviceErrorSubscriptions[device.id];

    self.currentState.plugged = _.reject(self.currentState.plugged, function(d) {
      return d.id === device.id;
    });
    self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
      return dc.id === device.id;
    });

    if (self.log) self.log('unplug device with id ' + device.id);
    self.emit('unplug', device);
  });
}

util.inherits(DeviceGuider, EventEmitter2);


/* Override of EventEmitter. */
DeviceGuider.prototype.on = function(eventname, callback) {
  if (this.deviceLoader && (eventname === 'plug' || eventname === 'unplug')) {
    this.deviceLoader.on.apply(this.deviceLoader, _.toArray(arguments));
    if (!this.deviceLoader.isRunning) {
      this.lookupStarted = true;
      this.deviceLoader.startLookup();
    }
  } else {
    EventEmitter2.prototype.on.apply(this, _.toArray(arguments));
  }
};

/* Override of EventEmitter. */
DeviceGuider.prototype.removeListener = function(eventname, callback) {
  if (this.deviceLoader && (eventname === 'plug' || eventname === 'unplug')) {
    this.deviceLoader.removeListener.apply(this.deviceLoader, _.toArray(arguments));
    if (this.deviceLoader.listeners('plug').length === 0 && this.deviceLoader.listeners('unplug').length === 0 ) {
      this.lookupStarted = false;
      this.deviceLoader.stopLookup();
    }
  } else {
    EventEmitter2.prototype.removeListener.apply(this, _.toArray(arguments));
  }
};

/* Same as removeListener */
DeviceGuider.prototype.off = DeviceGuider.prototype.removeListener;

/**
 * Checks if the connectionMode will change and returns true or false.
 * @param  {String} mode The new connectionMode.
 * @return {Boolean}     Returns true or false.
 */
DeviceGuider.prototype.checkConnectionMode = function(mode) {
  return mode !== this.currentState.connectionMode;
};

/**
 * Checks if the connectionMode will change and emits 'connectionModeChanged'.
 * @param  {String} mode The new connectionMode.
 * @return {Boolean}     Returns true or false.
 */
DeviceGuider.prototype.changeConnectionMode = function(mode) {
  var self = this;

  var somethingChanged = this.checkConnectionMode(mode);
  this.currentState.connectionMode = mode;

  if (somethingChanged) {
    this.emit('connectionModeChanged', this.currentState.connectionMode);
  }

  return somethingChanged;
};

/**
 * Calls the callback with the current state, containing the connectionMode,
 * the list of plugged devices and the list of connected devices.
 * @param  {Function} callback The function, that will be called when state is fetched.
 *                             `function(err, currentState){}` currentState is an object.
 */
DeviceGuider.prototype.getCurrentState = function(callback) {
  var self = this;

  if (this.currentState.plugged.length > 0) {
    if (callback) { callback(null, this.currentState); }
  } else {
    if (!this.deviceLoader.isRunning && !this.lookupStarted) {
      this.deviceLoader.startLookup(function(err, devices) {
        if (callback) { callback(null, self.currentState); }
      });
    } else {
      this.deviceLoader.trigger(function(err, devices) {
        if (callback) { callback(null, self.currentState); }
      });
    }
  }
};

/**
 * It emits 'connectionModeChanged'.
 * When plugging a device it will now automatically connect it and emit 'connect'.
 * Already plugged devices will connect immediately.
 */
DeviceGuider.prototype.autoconnect = function() {
  var self = this;

  if (this.changeConnectionMode('autoconnect')) {
    if (!this.deviceLoader.isRunning && !this.lookupStarted) {
      this.deviceLoader.startLookup();
    }

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

/**
 * [manualconnect description]
 * @param  {Boolean}   holdConnections If set established connections will not be closed. [optional]
 * @param  {Function} callback The function, that will be called when function has finished. [optional]
 *                             `function(err){}`
 */
DeviceGuider.prototype.manualconnect = function(holdConnections, callback) {
  var self = this;

  if (arguments.length === 1) {
    if (_.isFunction(holdConnections)) {
      callback = holdConnections;
      holdConnections = false;
    }
  }

  if (this.changeConnectionMode('manualconnect')) {
    if (this.currentState.connected.length === 0) {
      if (callback) { return callback(null); }
    }

    if (!holdConnections) {
      async.forEachSeries(this.currentState.connected, function(dc, clb) {
        self.closeConnection(dc.connection, clb);
      }, function(err) {
        if (callback) { return callback(err); }
      });
    } else {
      if (callback) { return callback(null); }
    }
  } else {
    if (callback) { return callback(null); }
  }
};

/**
 * It emits 'connectionModeChanged'.
 * When plugging one device it will now automatically connect one and emit 'connect'.
 * If there is already a plugged device, it will connect immediately and call the callback.
 * @param  {Function} callback The function, that will be called when one device is connected. [optional]
 *                             `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.autoconnectOne = function(callback) {
  var self = this;

  function doIt() {
    if (self.currentState.plugged.length > 0 && self.currentState.connected.length === 0) {
      self.connectDevice(self.currentState.plugged[0], callback);
    } else {
      if (callback) callback('No device available!');
    }
  }

  if (this.changeConnectionMode('autoconnectOne')) {
    if (!this.deviceLoader.isRunning && !this.lookupStarted) {
      this.deviceLoader.startLookup(doIt);
    } else {
      doIt();
    }
  } else {
    if (callback) { return callback(null); }
  }
};

/**
 * It will connect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback   The function, that will be called when the device is connected. [optional]
 *                                         `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.connectDevice = function(deviceOrId, callback) {
  var self = this,
      device = deviceOrId;

  if (_.isString(deviceOrId)) {
    device = this.currentState.getDevice(deviceOrId);
  }

  if (!this.deviceErrorSubscriptions[device.id]) {
    this.deviceErrorSubscriptions[device.id] = function(err) {
      self.emit('error', err);
    };
    this.on('error', this.deviceErrorSubscriptions[device.id]);
  }

  device.on('connecting', function(dev) {
    if (self.log) self.log('connecting device with id ' + dev.id);
    self.emit('connecting', dev);
    self.emit('connectionStateChanged', { state: 'connecting', device: dev });
  });

  device.connect(function(err, connection) {
    if (err) {
      if (self.log) self.log('error calling connect' + JSON.stringify(err));
      //self.emit('error', err);
      if (callback) {
        callback(err, connection);
      }
      return;
    }
    self.currentState.connected.push(device);

    connection.on('disconnecting', function(conn) {
      if (self.log) self.log('disconnecting device with id ' + conn.device.id + ' and connection id ' + conn.id);
      self.emit('disconnecting', conn.get('device'));
      self.emit('connectionStateChanged', { state: 'disconnecting', device: conn.get('device'), connection: conn });
    });

    connection.on('disconnect', function(conn) {
      self.currentState.connected = _.reject(self.currentState.connected, function(dc) {
        return dc.id === conn.device.id;
      });

      if (self.log) self.log('disconnect device with id ' + conn.device.id + ' and connection id ' + conn.id);
      self.emit('disconnect', conn);
      self.emit('connectionStateChanged', { state: 'disconnect', connection: conn, device: conn.device });
    });

    if (self.log) self.log('connect device with id ' + device.id + ' and connection id ' + connection.id);
    self.emit('connect', connection);
    self.emit('connectionStateChanged', { state: 'connect', connection: connection, device: connection.device });

    if (callback) callback(err, connection);
  });
};

/**
 * It will disconnect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback  The function, that will be called when the device is disconnected. [optional]
 *                                        `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.disconnectDevice = function(deviceOrId, callback) {
  var self = this,
      device = deviceOrId;

  if (_.isString(deviceOrId)) {
    device = this.currentState.getConnectedDevice(deviceOrId);
  }

  if (!device) {
    if (this.log) this.log('Device not connected!');
    //self.emit('error', 'Device not connected!');
    if (callback) { callback('Device not connected!'); }
    return;
  }

  device.disconnect(function(err) {
    if (err) {
      if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
      //self.emit('error', err);
      if (callback) {
        callback(err, device.connection);
      }
      return;
    }

    if (callback) callback(err, device.connection);
  });
};

/**
 * It will close that connection and call the callback.
 * @param  {Connection || String}   connectionOrId The connection object or the connection id.
 * @param  {Function}               callback      The function, that will be called when the connection is closed. [optional]
 *                                                `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.closeConnection = function(connectionOrId, callback) {
  var self = this,
      connection = connectionOrId;

  if (_.isString(connectionOrId)) {
    connection = this.currentState.getConnection(connectionOrId);
  }

  connection.close(function(err) {
    if (err) {
      if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
      //self.emit('error', err);
      if (callback) {
        callback(err, connection);
      }
      return;
    }

    if (callback) callback(err, connection);
  });
};

module.exports = DeviceGuider;