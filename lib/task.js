var _ = require('lodash');

function Task() {}

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

    connection.executeTask(taskOrCommand, ignoreQueue, callback);

  } else if (taskOrCommand) {

    taskOrCommand.execute(connection, callback);

  } else {

    connection.executeTask(this, ignoreQueue, callback);

  }
};

module.exports = Task;