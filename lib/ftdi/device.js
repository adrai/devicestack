var ftdi = require("ftdi"),
    Device = require('../device'),
    util = require('util'),
    _ = require('lodash');

/**
 * FtdiDevice represents your physical device.
 * Extends Device.
 * @param {Object} deviceSettings     The device settings (locationId, serial, index, description).
 * @param {Object} connectionSettings The connection settings (baudrate, databits, stopbits, parity).
 * @param {Object} Connection         The constructor function of the connection.
 */
function FtdiDevice(deviceSettings, connectionSettings, Connection) {

  // call super class
  Device.call(this, Connection);

  if (deviceSettings instanceof ftdi.FtdiDevice) {
    this.ftdiDevice = deviceSettings;
    this.set(this.ftdiDevice.deviceSettings);
  } else {
    this.set(deviceSettings);
  }

  this.set('connectionSettings', connectionSettings);
}

util.inherits(FtdiDevice, Device);

/**
 * The open mechanism of the device.
 * On opened 'open' will be emitted and the callback will be called.
 * @param  {Function} callback The function, that will be called when device is opened. [optional]
 *                             `function(err){}`
 */
FtdiDevice.prototype.open = function(callback) {
  var self = this;

  if (!this.ftdiDevice) {
    this.ftdiDevice = new ftdi.FtdiDevice(this.toJSON());
  }

  this.ftdiDevice.open(this.get('connectionSettings'), function(err) {
    self.ftdiDevice.on('error', function(err) {
      if(!_.isString(err)) {
        err = err.toString();
      }

      if (self.listeners('error').length) {
        self.emit('error', err);
      }
    });

    if (err) {
      if (self.log) self.log('error while opening device');
      if (callback) callback(err);
      return;
    }
    if (self.log) self.log('open device with id ' + self.id);
    self.emit('open', callback);
    if (!self.connection && callback) callback(err);
  });

  this.ftdiDevice.on('close', function() {
    if (self.log) self.log('close device with id ' + self.id);
    self.emit('close');
    self.removeAllListeners();
    self.ftdiDevice.removeAllListeners();
    self.ftdiDevice.removeAllListeners('open');
  });

  this.ftdiDevice.on('data', function(data) {
    if (self.log) self.log('<< ' + data.toHexDebug());
    self.emit('receive', data.toArray());
  });

  this.on('send', function(data) {
    if (self.log) self.log('>> ' + data.toHexDebug());
    self.ftdiDevice.write(data.toBuffer());
  });
};

/**
 * The close mechanism of the device.
 * @param  {Function} callback The function, that will be called when device is closed. [optional]
 *                             `function(err){}`
 * @param  {Boolean}  fire     Forces the callback to be called. [optional]
 */
FtdiDevice.prototype.close = function(callback, fire) {
  var self = this;
  if (!this.ftdiDevice) {
    if (callback && (!this.connection || fire)) callback(null);
    return;
  }
  this.ftdiDevice.close(function(err) {
    if (callback && (!self.connection || fire)) callback(err);
  });
};

module.exports = FtdiDevice;