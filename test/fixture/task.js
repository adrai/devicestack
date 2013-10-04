var Task = require('../../index').Task,
    util = require('util'),
    Command = require('./command');

function MyTask(identifier) {
  // call super class
  Task.call(this, arguments);
}

util.inherits(MyTask, Task);

MyTask.prototype.initialize = function(connection, identifier) {
  if (identifier === 111) {
    throw new Error('wrong value in task');
  }

  this.command = new Command(identifier);
};

MyTask.prototype.perform = function(connection, callback) {
  this.execute(this.command, connection, callback);
};

module.exports = MyTask;