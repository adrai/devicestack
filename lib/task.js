var _ = require('lodash');

function Task() {
  var self = this;

  if (this.log) {
    this.log = _.wrap(this.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
  } else if (Task.prototype.log) {
    Task.prototype.log = _.wrap(Task.prototype.log, function(func, msg) {
      func(self.constructor.name + ': ' + msg);
    });
    this.log = Task.prototype.log;
  }
}

Task.prototype.perform = function(connection, callback) {
  throw new Error('Implement the perform function!');
};

/**
 * Executes this task or an other task or a command.
 * @param  {Function}   callback   The function, that should be called when the task's or command's answer is received.
 *                                 `function(err, res){}`
 *
 * @example:
 *     this.execute(myTask, connection, false, function(err, res) {});
 *     // or
 *     this.execute(myTask, connection, function(err, res) {});
 *     // or
 *     this.execute(myCommand, connection, function(err, res) {});
 *     // or
 *     this.execute(connection, true, function(err, res) {});
 *     // or
 *     this.execute(connection, function(err, res) {});
 */
Task.prototype.execute = function(taskOrCommand, connection, ignoreQueue, callback) {
  if (arguments.length === 2) {

    ignoreQueue = false;
    callback = connection;
    connection = taskOrCommand;
    taskOrCommand= null;

  } else if (arguments.length === 3 && _.isBoolean(connection)) {

    callback = ignoreQueue;
    ignoreQueue = connection;
    connection = taskOrCommand;
    taskOrCommand= null;

  } else if (arguments.length === 3 && !_.isBoolean(connection)) {

    callback = ignoreQueue;
    ignoreQueue = true;

  }

  if (taskOrCommand && taskOrCommand instanceof Task) {

    if (this.log) { this.log('Start executing TASK: ' + taskOrCommand.constructor.name); }
    connection.executeTask(taskOrCommand, ignoreQueue, callback);

  } else if (taskOrCommand) {

    if (this.log) { this.log('Start executing COMMAND: ' + taskOrCommand.constructor.name); }
    taskOrCommand.execute(connection, callback);

  } else {

    if (this.log) { this.log('Start executing...'); }
    connection.executeTask(this, ignoreQueue, callback);

  }
};

module.exports = Task;