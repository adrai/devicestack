var Connection = require('../../index').Connection
  , util = require('util')
  , _ = require('lodash')
  , FrameHandler = require('./framehandler');

function MyConnection(device) {
    var self = this;

    // call super class
    Connection.call(this, device);

    this.frameHandler = new FrameHandler(this.device);
    this.frameHandler.on('receive', function (frame) {
        // forward to appropriate command...
    });
}

util.inherits(MyConnection, Connection);

// MyConnection.prototype.onConnecting = function(callback) {
//     // Need to send some commands before definitely connected?
//     if (callback) callback();
// };

// MyConnection.prototype.onDisconnecting = function(callback) {
//     // Need to send some commands before definitely closed?
//     if (callback) callback();
// };

MyConnection.prototype.executeCommand = function(commandData, callback) {
    this.frameHandler.send('send', commandData);
};

module.exports = MyConnection;