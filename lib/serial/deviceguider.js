var DeviceGuider = require('../deviceguider'),
    util = require('util'),
    _ = require('lodash'),
    DeviceNotFound = require('../errors/deviceNotFound');

/**
 * A serialdeviceguider emits 'plug' for new attached serial devices,
 * 'unplug' for removed serial devices, emits 'connect' for connected serial devices
 * and emits 'disconnect' for disconnected serial devices.
 * @param {SerialDeviceLoader} deviceLoader The deviceloader object.
 */
function SerialDeviceGuider(deviceLoader) {
  var self = this;

  // call super class
  DeviceGuider.call(this, deviceLoader);

  this.currentState.getDeviceByPort = function(port) {
    return _.find(self.currentState.plugged, function(d) {
      return d.get('portName') && port && d.get('portName').toLowerCase() === port.toLowerCase();
    });
  };

  this.currentState.getConnectedDeviceByPort = function(port) {
    return _.find(self.currentState.connected, function(d) {
      return d.get('portName') && port && d.get('portName').toLowerCase() === port.toLowerCase();
    });
  };
}

util.inherits(SerialDeviceGuider, DeviceGuider);

/**
 * It will connect that device and call the callback.
 * @param  {String}   port      The Com Port path or name for Windows.
 * @param  {Function} callback  The function, that will be called when the device is connected. [optional]
 *                              `function(err, connection){}` connection is a Connection object.
 */
SerialDeviceGuider.prototype.connect = function(port, callback) {
  if (_.isObject(port) && port.portName) {
    port = port.portName;
  }
  if (!_.isString(port) || (port.indexOf('COM') !== 0 && port.indexOf('/') !== 0)) {
    return DeviceGuider.prototype.connect.apply(this, arguments);
  }

  var device = this.currentState.getDeviceByPort(port);
  if (!device) {
    device = new this.deviceLoader.Device(port);
  }
  if (!this.deviceErrorSubscriptions[device.id]) {
    this.deviceErrorSubscriptions[device.id] = function(err) {
      if (self.listeners('error').length) {
        self.emit('error', err);
      }
    };
    this.on('error', this.deviceErrorSubscriptions[device.id]);
  }
  this.connect(device, callback);
};

/**
 * It will connect that device and call the callback.
 * @param  {String}   port      The Com Port path or name for Windows.
 * @param  {Function} callback  The function, that will be called when the device is disconnected. [optional]
 *                              `function(err, connection){}` connection is a Connection object.
 */
SerialDeviceGuider.prototype.disconnect = function(port, callback) {
  if (_.isObject(port) && port.portName) {
    port = port.portName;
  }
  if (!_.isString(port) || (port.indexOf('COM') !== 0 && port.indexOf('/') !== 0)) {
    return DeviceGuider.prototype.disconnect.apply(this, arguments);
  }

  var device = this.currentState.getConnectedDeviceByPort(port);
  if (!device) {
    var err = new DeviceNotFound('Device not found!');
    if (this.log) { this.log(err.message); }
    if (callback) { callback(err); }
    return;
  }
  this.disconnect(device, callback);
};

module.exports = SerialDeviceGuider;