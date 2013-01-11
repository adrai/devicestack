function Command() {}

/**
 * Executes this command.
 * @param  {Connection} connection The connection object.
 * @param  {Function}   callback   The function, that should be called when the command's answer is received.
 *                                 `function(err){}`
 */
Command.prototype.execute = function(connection, callback) {
  connection.executeCommand(this, callback);
};

module.exports = Command;