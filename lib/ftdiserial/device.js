var Device = require('../device'),
    SerialDevice = require('../serial/device'),
    FtdiDevice = require('../ftdi/device'),
    util = require('util'),
    _ = require('lodash');

/**
 * FtdiSerialDevice represents your physical device.
 * Extends Device.
 * @param {Object} deviceSettings     The device settings (locationId, serial, index, description) or (portName).
 * @param {Object} connectionSettings The connection settings (baudrate, databits, stopbits, parity).
 * @param {Object} Connection         The constructor function of the connection.
 */
function FtdiSerialDevice(deviceSettings, connectionSettings, Connection) {

  if (_.isString(deviceSettings) && (deviceSettings.indexOf('COM') === 0 || deviceSettings.indexOf('/') === 0)) {
    this.isSerialDevice = true;
    // call super class
    SerialDevice.call(this,
      deviceSettings,
      connectionSettings,
      Connection
    );
  } else {
    this.isFtdiDevice = true;
    // call super class
    FtdiDevice.call(this,
      deviceSettings,
      connectionSettings,
      Connection
    );
  }
}

util.inherits(FtdiSerialDevice, Device);

/**
 * The open mechanism of the device.
 * On opened 'open' will be emitted and the callback will be called.
 * @param  {Function} callback The function, that will be called when device is opened. [optional]
 *                             `function(err){}`
 */
FtdiSerialDevice.prototype.open = function(callback) {
  if (this.isFtdiDevice) {
    FtdiDevice.prototype.open.apply(this, _.toArray(arguments));
  } else if (this.isSerialDevice) {
    SerialDevice.prototype.open.apply(this, _.toArray(arguments));
  }
};

/**
 * The close mechanism of the device.
 * @param  {Function} callback The function, that will be called when device is closed. [optional]
 *                             `function(err){}`
 * @param  {Boolean}  fire     Forces the callnack to be called. [optional]
 */
FtdiSerialDevice.prototype.close = function(callback, fire) {
  if (this.isFtdiDevice) {
    FtdiDevice.prototype.close.apply(this, _.toArray(arguments));
  } else if (this.isSerialDevice) {
    SerialDevice.prototype.close.apply(this, _.toArray(arguments));
  }
};

module.exports = FtdiSerialDevice;