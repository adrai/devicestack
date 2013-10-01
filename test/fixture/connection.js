var Connection = require('../../index').Connection,
    util = require('util'),
    _ = require('lodash'),
    FrameHandler = require('./framehandler');

function MyConnection(device) {
  // call super class
  Connection.call(this, device);

  var self = this;

  this.frameHandler = new FrameHandler(this.device);
  this.frameHandler.on('receive', function (frame) {
    // forward to appropriate command...
    var cmds = self.getWaitingCommands(frame);
    _.each(cmds, function(cmd) {
      if (cmd.callback)  {
        cmd.callback(null, frame);
        delete cmd.callback;
      }
      self.commandQueue.splice(_.indexOf(self.commandQueue, cmd), 1);
    });

    self.checkForNextExecution();
  });
}

util.inherits(MyConnection, Connection);

// MyConnection.prototype.onConnecting = function(callback) {
//   // Need to send some commands before definitely connected?
//   if (callback) callback();
// };

// MyConnection.prototype.onDisconnecting = function(callback) {
//   // Need to send some commands before definitely closed?
//   if (callback) callback();
// };

MyConnection.prototype.getWaitingCommands = function(frame) {
  return _.filter(this.commandQueue, function(cmd) {
    return frame && frame.length > 0 && frame[0] === cmd.command.data[0];
  });
};

MyConnection.prototype.sendCommand = function(command, callback) {
  command.data = command.data || [];
  if (!Array.isByteArray(command.data)) {
    this.dequeueCommand(command);
    if (this.log) { this.log('Wrong data for COMMAND: ' + command.constructor.name); }
    if (callback) { callback(new Error('Wrong command data!')); }
    return;
  }
  this.frameHandler.send(command.data);
};

module.exports = MyConnection;