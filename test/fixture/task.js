var Task = require('../../index').Task,
		util = require('util'),
    Command = require('./command');

function MyTask(identifier) {
	// call super class
  Task.call(this);

	this.command = new Command(identifier);
}

util.inherits(MyTask, Task);

MyTask.prototype.perform = function(connection, callback) {
	this.execute(this.command, connection, callback);
};

module.exports = MyTask;