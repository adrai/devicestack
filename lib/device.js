var EventEmitter2 = require('eventemitter2').EventEmitter2,
    util = require('util'),
    _ = require('lodash'),
    uuid = require('node-uuid').v4;

/**
 * Device represents your physical device.
 * @param {Object} Connection The constructor function of the connection.
 */
function Device(Connection) {
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
  } else if (Device.prototype.log) {
    Device.prototype.log = _.wrap(Device.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Device.prototype.log;
  } else {
    var debug = require('debug')(this.constructor.name);
    this.log = function(msg) {
      debug(msg);
    };
  }

  this.id = uuid();
  this.Connection = Connection;

  this.attributes = { id: this.id };

  this.on('disconnect', function() {
    self.connection = null;
  });
}

util.inherits(Device, EventEmitter2);

/**
 * Sets attributes for the device.
 * 
 * @example:
 *     device.set('firmwareVersion', '0.0.1');
 *     // or
 *     device.set({
 *          firmwareVersion: '0.0.1',
 *          bootloaderVersion: '0.0.1'
 *     });
 */
Device.prototype.set = function(data) {
  if (arguments.length === 2) {
    this.attributes[arguments[0]] = arguments[1];
  } else {
    for(var m in data) {
      this.attributes[m] = data[m];
    }
  }
};

/**
 * Gets an attribute of the device.
 * @param  {string} attr The attribute name.
 * @return {object}      The result value.
 *
 * @example:
 *     device.get('firmwareVersion'); // returns '0.0.1'
 */
Device.prototype.get = function(attr) {
  return this.attributes[attr];
};

/**
 * Returns `true` if the attribute contains a value that is not null
 * or undefined.
 * @param  {string} attr The attribute name.
 * @return {boolean}     The result value.
 *
 * @example:
 *     device.has('firmwareVersion'); // returns true or false
 */
Device.prototype.has = function(attr) {
  return (this.get(attr) !== null && this.get(attr) !== undefined);
};

/**
 * The connect mechanism of the device.
 * On connecting 'opening' will be emitted.
 * Creates a new connection instance and calls open by passing the callback.
 * @param  {Function} callback The function, that will be called when device is connected. [optional]
 *                             `function(err, connection){}` connection is a Connection object.
 */
Device.prototype.connect = function(callback) {
  if (this.Connection) {
    if (this.log) this.log('opening device with id ' + this.id);
    this.emit('opening');
    this.connection = new this.Connection(this);
  }
  this.open(callback);
};

/**
 * The disconnect mechanism of the device.
 * On disconnecting 'closing' will be emitted.
 * @param  {Function} callback The function, that will be called when device is disconnected. [optional]
 *                             `function(err){}`
 */
Device.prototype.disconnect = function(callback) {
  var self = this;

  if (this.connection && this.connection.close) {
    if (this.log) this.log('closing device with id ' + this.id);
    this.emit('closing', callback);
  } else {
    this.close(callback);
  }
};

/**
 * The send mechanism.
 * @param  {Array} data A "byte" array.
 */
Device.prototype.send = function(data) {
  this.emit('send', data);
};

/* The toJSON function will be called when JSON.stringify(). */
Device.prototype.toJSON = function() {
  var parse = JSON.deserialize || JSON.parse;
  var json = parse(JSON.stringify(this.attributes));
  json.connection = this.connection ? { id: this.connection.id } : undefined;
  return json;
};

Device.prototype.copy = function() {
  var clone = new Device(this.Connection);
  if (this.connection) {
    clone.connection = this.connection.copy(this);
  }
  clone.set(this.attributes);
  clone.set('id', clone.id);
  return clone;
};

module.exports = Device;