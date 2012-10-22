var expect = require('expect.js')
  , deviceguider = require('./fixture/deviceguider');

describe('DeviceGuider', function() {

    describe('having a deviceguider object', function() {

        it('it should have all expected values', function() {

            expect(deviceguider.getCurrentState).to.be.a('function');
            expect(deviceguider.autoconnect).to.be.a('function');
            expect(deviceguider.manualconnect).to.be.a('function');
            expect(deviceguider.autoconnectOne).to.be.a('function');
            expect(deviceguider.connect).to.be.a('function');
            expect(deviceguider.disconnectDevice).to.be.a('function');
            expect(deviceguider.closeConnection).to.be.a('function');

        });

        describe('having plugged devices', function() {

            it('it should emit plug', function(done) {

                deviceguider.once('plug', function(device) {
                    expect(device).to.be.an('object');
                    
                    done();
                });

            });

        });

        describe('calling getCurrentState', function() {

            it('it should callback the correct object', function(done) {

                deviceguider.getCurrentState(function(err, currentState) {
                    expect(currentState.plugged).to.be.an('array');
                    expect(currentState.connected).to.be.an('array');
                    expect(currentState.doAutoconnect).to.be.a('boolean');
                    expect(currentState.connectOne).to.be.a('boolean');
                    expect(currentState.getDevice).to.be.a('function');
                    expect(currentState.getConnection).to.be.a('function');
                    expect(currentState.getDeviceByConnection).to.be.a('function');
                    expect(currentState.getConnectionByDevice).to.be.a('function');
                    done();
                });

            });

        });

        describe('calling autoconnect', function() {

            beforeEach(function(done) {
                deviceguider.manualconnect(done);
            });

            it('it should automatically connect plugged devices', function(done) {

                deviceguider.once('connect', function(connection) {
                    expect(connection).to.be.an('object');

                    done();
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

            it('it should automatically connect the first plugged device', function(done) {

                deviceguider.autoconnectOne(function(err, connection) {
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

            it('it should emit disconnect', function(done) {

                deviceguider.once('disconnect', function(connection) {
                    done();
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