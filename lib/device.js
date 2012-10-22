var EventEmitter2 = require('eventemitter2').EventEmitter2
  , util = require('util')
  , _ = require('lodash')
  , uuid = require('node-uuid').v4;

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
    }

    this.id = uuid();
    this.Connection = Connection;
}

util.inherits(Device, EventEmitter2);

Device.prototype.connect = function(callback) {
    if (this.Connection) {
        if (this.log) this.log('opening device with id ' + this.id);
        this.emit('opening');
        this.connection = new this.Connection(this);
    }
    this.open(callback);
};

Device.prototype.disconnect = function(callback) {
    var self = this;

    if (this.connection && this.connection.close) {
        if (this.log) this.log('closing device with id ' + this.id);
        this.emit('closing', callback);
    } else {
        this.close(callback);
    }
};

Device.prototype.send = function(data) {
    this.emit('send', data);
};

module.exports = Device;