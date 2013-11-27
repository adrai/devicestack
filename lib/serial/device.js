var sp = require("serialport"),
    Device = require('../device'),
    util = require('util'),
    _ = require('lodash'),
    PortNotFound = require('../errors/portNotFound'),
    PortAccessDenied = require('../errors/portAccessDenied');

/**
 * SerialDevice represents your physical device.
 * Extends Device.
 * @param {string} port       The Com Port path or name for Windows.
 * @param {Object} settings   The Com Port Settings.
 * @param {Object} Connection The constructor function of the connection.
 */
function SerialDevice(port, settings, Connection) {

  // call super class
  Device.call(this, Connection);

  this.set('portName', port);
  this.set('settings', settings);

  this.set('state', 'close');
}

util.inherits(SerialDevice, Device);

/**
 * The open mechanism of the device.
 * On opened 'open' will be emitted and the callback will be called.
 * @param  {Function} callback The function, that will be called when device is opened. [optional]
 *                             `function(err){}`
 */
SerialDevice.prototype.open = function(callback) {
  var self = this;

  if (this.get('state') !== 'close') {
    if (this.log) this.log('Calling open... Device is already "' + this.get('state') + '"!');
    if (callback) callback(new Error('Device is already "' + this.get('state') + '"!'));
    return;
  }

  if (!this.serialPort) {
    this.serialPort = new sp.SerialPort(this.get('portName'), this.get('settings'), false);
  }

  this.set('state', 'opening');
  this.emit('opening');

  this.serialPort.on('error', function(err) {
    if (self.log) self.log(err);

    if (self.listeners('error').length) {
      self.emit('error', err);
    }
  });

  this.serialPort.open(function(err) {
    if (err) {
      if (!err.name) {
        err = new Error(err);
      }

      if (err.message &&
          err.message.toLowerCase().indexOf('not') >= 0 &&
          err.message.toLowerCase().indexOf('found') >= 0) {
        err = new PortNotFound(err.message);
      } else if (err.message &&
          err.message.toLowerCase().indexOf('denied') >= 0) {
        err = new PortAccessDenied(err.message);
      }

      if (self.log) self.log('error while opening device');
      if (callback) callback(err);
      return;
    }
    if (self.log) self.log('open device with id ' + self.id);
    self.set('state', 'open');
    self.emit('open', callback);
    if (!self.connection && callback) callback(null);
  });

  this.serialPort.on('close', function() {
    if (self.log) self.log('close device with id ' + self.id);
    self.set('state', 'close');
    self.emit('close');
    self.removeAllListeners();
    self.serialPort.removeAllListeners();
    self.serialPort.removeAllListeners('open');
  });

  this.serialPort.on('data', function(data) {
    if (self.log) self.log('<< ' + data.toHexDebug());
    self.emit('receive', data.toArray());
  });

  this.on('send', function(data) {
    if (self.log) self.log('>> ' + data.toHexDebug());
    self.serialPort.write(data.toBuffer());
  });
};

/**
 * The close mechanism of the device.
 * @param  {Function} callback The function, that will be called when device is closed. [optional]
 *                             `function(err){}`
 * @param  {Boolean}  fire     Forces the callnack to be called. [optional]
 */
SerialDevice.prototype.close = function(callback, fire) {
  if (this.get('state') !== 'open') {
    if (this.log) this.log('Calling close... Device is already "' + this.get('state') + '"!');
    if (callback) callback(new Error('Device is already "' + this.get('state') + '"!'));
    return;
  }

  this.set('state', 'closing');
  this.emit('closing');
  
  var self = this;
  if (!this.serialPort) {
    if (callback && (!this.connection || fire)) callback(null);
    return;
  }
  this.serialPort.close(function(err) {
    if (err && !err.name) {
      err = new Error(err);
    }
    if (callback && (!self.connection || fire)) callback(err);
  });
};

module.exports = SerialDevice;