var Command = require('../../index').Command,
		util = require('util');

function MyCommand(firstByte) {
	// call super class
  Command.call(this);

  firstByte = firstByte || 0x01;

	this.data = [firstByte, 0x02, 0x03];
}

util.inherits(MyCommand, Command);

MyCommand.prototype.execute = function(connection, callback) {
  connection.executeCommand(this, callback);
};

module.exports = MyCommand;