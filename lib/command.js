function Command() {
  var self = this;

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (Command.prototype.log) {
    Command.prototype.log = _.wrap(Command.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Command.prototype.log;
  }
}

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