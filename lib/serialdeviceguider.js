var DeviceGuider = require('./deviceguider')
  , util = require('util')
  , _ = require('lodash');

function SerialDeviceGuider(deviceLoader) {
    var self = this;

    // call super class
    DeviceGuider.call(this, deviceLoader);

    this.currentState.getDeviceByPort = function(port) {
        return _.find(self.currentState.plugged, function(d) {
            return d.get('portName') === port;
        });
    };
    
    this.currentState.getConnectedDeviceByPort = function(id) {
        return _.find(self.currentState.connected, function(dc) {
            return dc.get('portName') === port;
        });
    };
}

util.inherits(SerialDeviceGuider, DeviceGuider);

SerialDeviceGuider.prototype.connect = function(port, callback) {
    this.connectDevice(new this.deviceLoader.Device(port), callback);
};

SerialDeviceGuider.prototype.disconnect = function(port, callback) {
    var device = this.currentState.getConnectedDeviceByPort(port);
    this.disconnectDevice(device, callback);
};

module.exports = SerialDeviceGuider;