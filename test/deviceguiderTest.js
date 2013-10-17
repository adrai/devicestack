var expect = require('expect.js'),
    deviceguider = require('./fixture/deviceguider');

describe('DeviceGuider', function() {

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

  describe('having a deviceguider object', function() {

    it('it should have all expected values', function() {

      expect(deviceguider.getCurrentState).to.be.a('function');
      expect(deviceguider.autoconnect).to.be.a('function');
      expect(deviceguider.manualconnect).to.be.a('function');
      expect(deviceguider.autoconnectOne).to.be.a('function');
      expect(deviceguider.disconnectDevice).to.be.a('function');
      expect(deviceguider.connectDevice).to.be.a('function');
      expect(deviceguider.closeConnection).to.be.a('function');
      expect(deviceguider.changeConnectionMode).to.be.a('function');

    });

    describe('calling getCurrentState', function() {

      it('it should callback the correct object', function(done) {

        deviceguider.getCurrentState(function(err, currentState) {
          expect(currentState.plugged).to.be.an('array');
          expect(currentState.connected).to.be.an('array');
          expect(currentState.connectionMode).to.be.a('string');
          expect(currentState.getDevice).to.be.a('function');
          expect(currentState.getConnection).to.be.a('function');
          expect(currentState.getDeviceByConnection).to.be.a('function');
          expect(currentState.getConnectionByDevice).to.be.a('function');
          done();
        });

      });

    });

    describe('calling changeConnectionMode', function() {

      beforeEach(function(done) {
        deviceguider.manualconnect(done);
      });

      describe('changing the mode', function() {

        it('it should emit connectionModeChanged', function(done) {

          deviceguider.once('connectionModeChanged', function(connectionMode) {
            expect(connectionMode).to.eql('autoconnect');
            done();
          });

          deviceguider.changeConnectionMode('autoconnect');

        });

        it('it should return true', function() {

          var result = deviceguider.changeConnectionMode('autoconnect');
          expect(result).to.eql(true);

        });

      });

      describe('not changing the mode', function() {

        it('it should return false', function() {

          var result = deviceguider.changeConnectionMode('manualconnect');
          expect(result).to.eql(false);

        });

      });

    });

    describe('calling autoconnect', function() {

      beforeEach(function(done) {
        deviceguider.manualconnect(done);
      });

      it('it should emit connecting', function(done) {

        deviceguider.once('connecting', function(dev) {
          expect(dev).to.be.an('object');

          done();
        });
        deviceguider.autoconnect();

      });

      it('it should emit connectionStateChanged', function(done) {

        deviceguider.once('connectionStateChanged', function(res) {
          expect(res.state).to.eql('connecting');
          expect(res.device).to.be.an('object');

          done();
        });
        deviceguider.autoconnect();

      });

      it('it should automatically connect plugged devices', function(done) {

        deviceguider.once('connect', function(connection) {
          expect(connection).to.be.an('object');

          done();
        });
        deviceguider.autoconnect();

      });

      it('it should emit connectionStateChanged', function(done) {

        var handle;
        deviceguider.on('connectionStateChanged', handle = function(res) {
          if (res.state === 'connect') {
            deviceguider.off('connectionStateChanged', handle);
            done();
          }
        });
        deviceguider.autoconnect();

      });

    });

    describe('calling autoconnectOne', function() {

      beforeEach(function(done) {
        deviceguider.manualconnect(done);
      });

      it('it should automatically connect the first plugged device by emitting connect', function(done) {

        deviceguider.once('connect', function(connection) {
          expect(connection).to.be.an('object');

          done();
        });
        deviceguider.autoconnectOne();

      });

      it('it should emit connectionStateChanged', function(done) {

        var handle;
        deviceguider.on('connectionStateChanged', handle = function(res) {
          if (res.state === 'connect') {
            deviceguider.off('connectionStateChanged', handle);
            done();
          }
        });
        deviceguider.autoconnectOne();

      });

      it('it should automatically connect the first plugged device', function(done) {

        deviceguider.autoconnectOne(function(err, connection) {
          expect(connection).to.be.ok(err);
          expect(connection).to.be.an('object');

          done();
        });

      });

    });

    describe('calling disconnectDevice', function() {

      var toDisconnect;

      beforeEach(function(done) {
        deviceguider.manualconnect(function() {
          deviceguider.once('connect', function(connection) {
            toDisconnect = connection.device;

            done();
          });
          deviceguider.autoconnect();
        });
      });

      it('it should emit disconnecting', function(done) {

        var called = false;
        deviceguider.once('disconnecting', function(con) {
          expect(con).to.be.an('object');
          called = true;
        });
        deviceguider.disconnectDevice(toDisconnect, function() {
          expect(called).to.eql(true);
          done();
        });

      });

      it('it should emit connectionStateChanged', function(done) {

        var called = false;
        deviceguider.once('connectionStateChanged', function(res) {
          expect(res.state).to.be.eql('disconnecting');
          expect(res.device).to.be.an('object');
          called = true;
        });
        deviceguider.disconnectDevice(toDisconnect, function() {
          expect(called).to.eql(true);
          done();
        });

      });

      it('it should emit disconnect', function(done) {

        deviceguider.once('disconnect', function(connection) {
          done();
        });
        deviceguider.disconnectDevice(toDisconnect);

      });

      it('it should emit connectionStateChanged', function(done) {

        var handle;
        deviceguider.on('connectionStateChanged', handle = function(res) {
          if (res.state === 'disconnect') {
            deviceguider.off('connectionStateChanged', handle);
            done();
          }
        });
        deviceguider.disconnectDevice(toDisconnect);

      });

      describe('with a callback', function() {

        it('it should call the callback', function(done) {

          deviceguider.disconnectDevice(toDisconnect, function(connection) {
            done();
          });

        });

      });

    });

    describe('calling closeConnection with the id', function() {

      var toClose;

      beforeEach(function(done) {
        deviceguider.manualconnect(function() {
          deviceguider.once('connect', function(connection) {
            toClose = connection;

            done();
          });
          deviceguider.autoconnect();
        });
      });

      it('it should emit disconnect', function(done) {

        deviceguider.once('disconnect', function(connection) {
          done();
        });
        deviceguider.closeConnection(toClose.id);

      });

      it('it should emit connectionStateChanged', function(done) {

        var handle;
        deviceguider.on('connectionStateChanged', handle = function(res) {
          if (res.state === 'disconnect') {
            deviceguider.off('connectionStateChanged', handle);
            done();
          }
        });
        deviceguider.closeConnection(toClose.id);

      });

      describe('with a callback', function() {

        it('it should call the callback', function(done) {

          deviceguider.closeConnection(toClose.id, function(connection) {
            done();
          });

        });

      });

    });

  });

});