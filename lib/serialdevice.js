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
        if (self.log) self.log('open device with id ' + self.id);
        self.emit('open', callback);
        if (!self.connection && callback) callback();
    });

    this.serialPort.on('close', function() {
        if (self.log) self.log('close device with id ' + self.id);
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

SerialDevice.prototype.close = function(callback, fire) {
    var self = this;
    this.serialPort.close(function(err) {
        if (callback && (!self.connection || fire)) callback(err);
    });
};

SerialDevice.prototype.toJSON = function() {
    var obj = {
        id: this.id,
        portName: this.portName,
        settings: this.settings
    };
    return  JSON.stringify(obj);
};

module.exports = SerialDevice;