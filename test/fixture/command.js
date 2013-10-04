var Command = require('../../index').Command,
    util = require('util');

function MyCommand(firstByte) {
  // call super class
  Command.call(this, arguments);
}

util.inherits(MyCommand, Command);

MyCommand.prototype.initialize = function(connection, firstByte) {

  firstByte = firstByte || 0x01;

  if (firstByte < 0) {
    throw new Error('wrong value');
  }

  this.data = [firstByte, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09];
};

MyCommand.prototype.execute = function(connection, callback) {
  connection.executeCommand(this, callback);
};

module.exports = MyCommand;