var util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    _ = require('lodash'),
    async = require('async'),
    DeviceNotFound = require('./errors/deviceNotFound');

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
  } else if (DeviceGuider.prototype.log) {
    DeviceGuider.prototype.log = _.wrap(DeviceGuider.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = DeviceGuider.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
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

  this.deviceLoader.on('plug', function(device) {

    self.deviceErrorSubscriptions[device.id] = function(err) {
      if (self.listeners('error').length) {
        self.emit('error', err);
      }
    };
    device.on('error', self.deviceErrorSubscriptions[device.id]);

    self.currentState.plugged.push(device);

    if (self.log) self.log('plug device with id ' + device.id);
    self.emit('plug', device);
    self.emit('plugChanged', { state: 'plug', device: device });

    if (self.currentState.connectionMode !== 'manualconnect') {
      if (self.currentState.connectionMode === 'autoconnect' || (self.currentState.connectionMode === 'autoconnectOne' && self.currentState.connected.length === 0)) {
        self.connect(device);
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
    self.emit('plugChanged', { state: 'unplug', device: device });
  });
}

util.inherits(DeviceGuider, EventEmitter2);


/* Override of EventEmitter. */
DeviceGuider.prototype.on = function(eventname, callback) {
  if (this.deviceLoader && (eventname === 'plugChanged' || eventname === 'plug' || eventname === 'unplug')) {
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
  if (this.deviceLoader && (eventname === 'plugChanged' || eventname === 'plug' || eventname === 'unplug')) {
    this.deviceLoader.removeListener.apply(this.deviceLoader, _.toArray(arguments));
    if (this.deviceLoader.listeners('plugChanged').length === 0 && this.deviceLoader.listeners('plug').length === 0 && this.deviceLoader.listeners('unplug').length === 0 ) {
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
 * @param  {Boolean}  directlyConnect If set, connections will be opened. [optional]
 * @param  {Function} callback The function, that will be called when function has finished. [optional]
 *                             `function(err){}`
 */
DeviceGuider.prototype.autoconnect = function(directlyConnect, callback) {
  var self = this;

  if (arguments.length === 1) {
    if (_.isFunction(directlyConnect)) {
      callback = directlyConnect;
      directlyConnect = false;
    }
  }

  if (this.changeConnectionMode('autoconnect')) {
    if (!this.deviceLoader.isRunning && !this.lookupStarted) {
      this.deviceLoader.startLookup();
    }

    if (!directlyConnect) {
      if (callback) { callback(null); }
      return;
    }

    var toConnect = _.reject(this.currentState.plugged, function(d) {
      return _.find(self.currentState.connected, function(c) {
        return c.id == d.id;
      });
    });

    async.forEachSeries(toConnect, function(dc, clb) {
      self.connect(dc, clb);
    }, function(err) {
      if (err && !err.name) {
        err = new Error(err);
      }
      if (callback) { return callback(err); }
    });
  } else {
    if (callback) { return callback(null); }
  }
};

/**
 * Call with optional holdConnections flag and optional callback it emits 'connectionModeChanged'.
 * When plugging a device it will not connect it.
 * Dependent on the holdConnections flag already connected devices will disconnect immediately and call the callback.
 * @param  {Boolean}  disconnectDirectly If set established connections will be closed. [optional]
 * @param  {Function} callback The function, that will be called when function has finished. [optional]
 *                             `function(err){}`
 */
DeviceGuider.prototype.manualconnect = function(disconnectDirectly, callback) {
  var self = this;

  if (arguments.length === 1) {
    if (_.isFunction(disconnectDirectly)) {
      callback = disconnectDirectly;
      disconnectDirectly = false;
    }
  }

  if (this.changeConnectionMode('manualconnect')) {
    if (this.currentState.connected.length === 0) {
      if (callback) { return callback(null); }
    }

    if (!disconnectDirectly) {
      if (callback) { callback(null); }
      return;
    }

    async.forEachSeries(this.currentState.connected, function(dc, clb) {
      self.closeConnection(dc.connection, clb);
    }, function(err) {
      if (err && !err.name) {
        err = new Error(err);
      }
      if (callback) { return callback(err); }
    });
  } else {
    if (callback) { return callback(null); }
  }
};

/**
 * It emits 'connectionModeChanged'.
 * When plugging one device it will now automatically connect one and emit 'connect'.
 * If there is already a plugged device, it will connect immediately and call the callback.
 * @param  {Boolean}   directlyConnect If set, connections will be opened. [optional]
 * @param  {Function} callback The function, that will be called when one device is connected. [optional]
 *                             `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.autoconnectOne = function(directlyConnect, callback) {
  var self = this;

  if (arguments.length === 1) {
    if (_.isFunction(directlyConnect)) {
      callback = directlyConnect;
      directlyConnect = false;
    }
  }

  function doIt() {
    if (!directlyConnect) {
      if (callback) callback(null);
      return;
    }

    if (self.currentState.plugged.length > 0 && self.currentState.connected.length === 0) {
      self.connect(self.currentState.plugged[0], callback);
    } else {
      if (callback) callback(new Error('No device available!'));
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
 * Changes the connection mode.
 * @param  {String}   mode     'autoconnect' || 'manualconnect' || 'autoconnectOne'
 * @param  {Object}   options  Options for connection mode
 * @param  {Function} callback The function, that will be called when function has finished [optional]
 *                             `function(err){}` connection is a Connection object.
 */
DeviceGuider.prototype.setConnectionMode = function(mode, options, callback) {
  if (arguments.length === 2) {
    if (_.isFunction(options)) {
      callback = options;
      options = false;
    }
  }

  if (mode === 'autoconnect') {
    this.autoconnect.apply(this, [options, callback]);
  } else if (mode === 'autoconnectOne') {
    this.autoconnectOne.apply(this, [options, callback]);
  } else if (mode === 'manualconnect') {
    this.manualconnect.apply(this, [options, callback]);
  } else {
    if (this.log) this.log('Connection Mode not valid!');
    if (callback) callback(new Error('Connection Mode not valid!'));
  }
};

/**
 * It will connect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback   The function, that will be called when the device is connected. [optional]
 *                                         `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.connect = function(deviceOrId, callback) {
  var self = this,
      device = deviceOrId;

  if (_.isString(deviceOrId)) {
    device = this.currentState.getDevice(deviceOrId);
  } else if (deviceOrId.id && !device.connect) {
    device = this.currentState.getDevice(deviceOrId.id);
  } else if (!deviceOrId.connect) {
    device = null;
  }

  if (!device) {
    var err = new DeviceNotFound('Device not found!');
    if (this.log) { this.log(err.message); }
    if (callback) { callback(err); }
    return;
  }

  if (!this.deviceErrorSubscriptions[device.id]) {
    this.deviceErrorSubscriptions[device.id] = function(err) {
      if (self.listeners('error').length) {
        self.emit('error', err);
      }
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
      if (!err.name) {
        err = new Error(err);
      }
      if (self.log) self.log('Error while calling connect: ' + err.name + (err.message ? ': ' + err.message : ''));
      if (callback) {
        callback(err, connection);
      }

      self.emit('disconnect', connection);
      self.emit('connectionStateChanged', { state: 'disconnect', connection: connection, device: device });
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

    if (callback) callback(null, connection);
  });
};

/**
 * It will connect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback   The function, that will be called when the device is connected. [optional]
 *                                         `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.connectDevice = DeviceGuider.prototype.connect;

/**
 * It will disconnect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback  The function, that will be called when the device is disconnected. [optional]
 *                                        `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.disconnect = function(deviceOrId, callback) {
  var self = this,
      device = deviceOrId;

  if (_.isString(deviceOrId)) {
    device = this.currentState.getConnectedDevice(deviceOrId);
  } else if (deviceOrId.id && !deviceOrId.disconnect) {
    device = this.currentState.getDevice(deviceOrId.id);
  } else if (!deviceOrId.disconnect) {
    device = null;
  }

  if (!device) {
    var err = new DeviceNotFound('Device not found!');
    if (this.log) { this.log(err.message); }
    if (callback) { callback(err); }
    return;
  }

  device.disconnect(function(err) {
    if (err) {
      if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
      if (callback) {
        if (!err.name) {
          err = new Error(err);
        }
        callback(err, device.connection);
      }
      return;
    }

    if (callback) callback(null, device.connection);
  });
};

/**
 * It will disconnect that device and call the callback.
 * @param  {Device || String}   deviceOrId The device object or the device id.
 * @param  {Function}           callback  The function, that will be called when the device is disconnected. [optional]
 *                                        `function(err, connection){}` connection is a Connection object.
 */
DeviceGuider.prototype.disconnectDevice = DeviceGuider.prototype.disconnect;

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

  if (!connection) {
    var error = new Error('Connection not found!');
    if (this.log) this.log('Connection not found!');
    if (callback) { callback(error); }
    return;
  }

  connection.close(function(err) {
    if (err) {
      if (self.log) self.log('error calling disconnect' + JSON.stringify(err));
      if (callback) {
        if (!err.name) {
          err = new Error(err);
        }
        callback(err, connection);
      }
      return;
    }

    if (callback) callback(null, connection);
  });
};

module.exports = DeviceGuider;