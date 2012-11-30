var EventEmitter2 = require('eventemitter2').EventEmitter2
  , util = require('util')
  , _ = require('lodash')
  , uuid = require('node-uuid').v4;

/**
 * Connection will be created from connect of device.
 * -reacts on open of device, calls onConnecting function if exists and emits 'connecting' and 'connect'
 * -reacts on closing of device and calls close on device
 * -reacts on close of device and cleans up
 * In extended constuctor create the framehandler(s) and subscribe to receive on the last framehandler.
 * 
 * @param {Device} device The device object.
 */
function Connection(device) {
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
    
    this.device = device;

    this.attributes = { id: this.id, device: this.device };

    this.device.on('open', this.openHandle = function(callback) {
        if (self.log) self.log('connecting connection with id ' + self.id);
        self.emit('connecting', self);
        if (self.onConnecting) {
            self.onConnecting(function() {
                if (self.log) self.log('connect connection with id ' + self.id);
                self.emit('connect', self);
                if (callback) callback(null, self);
            });
        } else {
            if (self.log) self.log('connect connection with id ' + self.id);
            self.emit('connect', self);
            if (callback) callback(null, self);
        }
    });

    this.device.on('closing', this.closingHandle = function(callback) {
        self.close(callback);
    });

    this.device.on('close', this.closeHandle = function(callback) {
        if (self.log) self.log('disconnect connection with id ' + self.id);
        self.emit('disconnect', self);
        self.removeAllListeners();
        self.removeAllListeners('connect');
        self.removeAllListeners('connecting');
        self.removeAllListeners('disconnect');
        self.removeAllListeners('disconnecting');
        self.device.removeListener('open', self.openHandle);
        self.device.removeListener('closing', self.closingHandle);
        // if (callback) callback(null, self);
    });
}

util.inherits(Connection, EventEmitter2);

/**
 * Sets attributes for the connection.
 * 
 * @example:
 *     connection.set('firmwareVersion', '0.0.1');
 *     // or
 *     connection.set({
 *          firmwareVersion: '0.0.1',
 *          bootloaderVersion: '0.0.1'
 *     });
 */
Connection.prototype.set = function(data) {
    if (arguments.length === 2) {
        this.attributes[arguments[0]] = arguments[1];
    } else {
        for(var m in data) {
            this.attributes[m] = data[m];
        }
    }
};

/**
 * Gets an attribute of the connection.
 * @param  {string} attr The attribute name.
 * @return {object}      [description]
 *
 * @example:
 *     connection.get('firmwareVersion'); // returns '0.0.1'
 */
Connection.prototype.get = function(attr) {
    return this.attributes[attr];
};

/**
 * The close mechanism.
 * On closing 'disconnecting' will be emitted.
 * onDisconnecting function will be called if it exists, 
 * @param  {Function} callback The function, that will be called when connection is closed. [optional]
 *                             `function(err){}`
 */
Connection.prototype.close = function(callback) {
    var self = this;
    if (this.log) this.log('disconnecting connection with id ' + self.id);
    this.emit('disconnecting', this);
    if (this.onDisconnecting) {
        this.onDisconnecting(function() {
            self.device.close(callback, true);
        });
    } else {
        this.device.close(callback, true);
    }
};

/* The toJSON function will be called when JSON.serialize(). */
Connection.prototype.toJSON = function() {
    return _.clone(this.attributes, true);
};

module.exports = Connection;