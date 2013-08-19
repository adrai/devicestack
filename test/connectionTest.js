var expect = require('expect.js'),
    Connection = require('./fixture/connection'),
    Device = require('./fixture/device'),
    Task = require('./fixture/task'),
    Command = require('./fixture/command');

describe('Connection', function() {

  after(function() {
    var pm;
    if ((pm = global['pm-notify'])) {
      pm.stopMonitoring();
    }
    var detection;
    if ((detection = global['usb-detection'])) {
      detection.stopMonitoring();
    }
  });

  var connection;
  var device = new Device();

  describe('creating a connection object', function() {

    beforeEach(function() {
      connection = new Connection(device);
    });

    it('it should have all expected values', function() {

      expect(connection.id).to.be.a('string');
      expect(connection.close).to.be.a('function');
      expect(connection.set).to.be.a('function');
      expect(connection.get).to.be.a('function');
      expect(connection.toJSON).to.be.a('function');
      expect(connection.executeCommand).to.be.a('function');
      expect(connection.executeTask).to.be.a('function');

    });

    describe('calling connect on the device', function() {

      it('it should emit connecting', function(done) {

        connection.once('connecting', function() {
          done();
        });
        device.connect();

      });

      it('it should emit connect', function(done) {

        connection.once('connect', function() {
          done();
        });
        device.connect();

      });

    });

    describe('calling executeCommand', function() {

      it('it should emit send on device', function(done) {

        device.once('send', function() {
          done();
        });
        connection.executeCommand(new Command(), function() {});

      });

      describe('of a command that validates an error', function() {

        it('it should callback that error', function(done) {

          connection.executeCommand(new Command(-1), function(err) {
            expect(err).to.be.ok();
            done();
          });

        });

      });

    });

    describe('calling executeTask', function() {

      it('it should emit send on device', function(done) {

        var send = false;

        device.once('send', function() {
          send = true;
        });
        connection.executeTask(new Task(), function() {
          expect(send).to.be.ok();
          done();
        });

      });

      describe('with ignoreQueue set to true', function() {

        it('it should bypass the queue', function(done) {

          var task1Executed,
              task2Executed,
              task3Executed;

          var task1Clb = function(err, res) {
            task1Executed = true;

            if (task1Executed && task2Executed && task3Executed) {
              done();
            }
          };

          var task2Clb = function(err, res) {
            task2Executed = true;

            if (task1Executed && task2Executed && task3Executed) {
              done();
            }
          };

          var task3Clb = function(err, res) {
            task3Executed = true;
            expect(task2Executed).not.to.be.ok();
            expect(task3Executed).to.be.ok();

            if (task1Executed && task2Executed && task3Executed) {
              done();
            }
          };

          connection.executeTask(new Task(1), task1Clb);
          connection.executeTask(new Task(2), task2Clb);
          connection.executeTask(new Task(3), true, task3Clb);

        });

      });

      describe('of a task that validates an error', function() {

        it('it should callback that error', function(done) {

          connection.executeTask(new Task(111), function(err) {
            expect(err).to.be.ok();
            done();
          });

        });

      });

      describe('of a task that validates an error in a command that he executes', function() {

        it('it should callback that error', function(done) {

          connection.executeTask(new Task(-1), function(err) {
            expect(err).to.be.ok();
            done();
          });

        });

      });

    });

    describe('calling disconnect on the device', function() {

      it('it should emit disconnecting', function(done) {

        connection.once('disconnecting', function() {
          done();
        });
        device.disconnect();

      });

      it('it should emit disconnect', function(done) {

        connection.once('disconnect', function() {
          done();
        });
        device.disconnect();

      });

    });

    describe('calling close', function() {

      it('it should emit disconnecting', function(done) {

        connection.once('disconnecting', function() {
          done();
        });
        connection.close();

      });

      it('it should emit disconnect', function(done) {

        connection.once('disconnect', function() {
          done();
        });
        connection.close();

      });

      describe('with a callback', function() {

        it('it should call the callback', function(done) {

          connection.close(function() {
            done();
          });

        });

      });

    });

  });

});