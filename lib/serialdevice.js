var sp = require("serialport")
  , Device = require('./device')
  , util = require('util')
  , _ = require('lodash');

function SerialDevice(port, settings, Connection) {
    var self = this;

    // call super class
    Device.call(this, Connection);

    this.portName = port;
    this.settings = settings;
}

util.inherits(SerialDevice, Device);

SerialDevice.prototype.open = function(callback) {
    var self = this;

    this.serialPort = new sp.SerialPort(this.portName, this.settings);

    this.serialPort.on('open', function() {
        self.emit('open', callback);
        if (!self.connection && callback) callback();
    });

    this.serialPort.on('close', function() {
        self.emit('close');
        self.removeAllListeners();
        self.serialPort.removeAllListeners();
    });

    this.serialPort.on('data', function(data) {
        if (_.contains(process.argv, '--debug')) console.log('        ' + self.constructor.name + ': << ' + data.toHexDebug());
        self.emit('receive', data.toArray());
    });

    this.on('send', function(data) {
        if (_.contains(process.argv, '--debug')) console.log('        ' + self.constructor.name + ': >> ' + data.toHexDebug());
        self.serialPort.write(data.toBuffer());
    });
};

SerialDevice.prototype.close = function(callback, fire) {
    var self = this;
    this.serialPort.close(function(err) {
        if (callback && (!self.connection || fire)) callback();
    });
};

module.exports = SerialDevice;