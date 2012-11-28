var expect = require('expect.js')
  , Connection = require('./fixture/connection')
  , Device = require('./fixture/device');

describe('Connection', function() {

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
                connection.executeCommand([]);

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