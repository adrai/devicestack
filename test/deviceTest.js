var expect = require('expect.js')
  , Device = require('./fixture/device');

describe('Device', function() {

    describe('without Connection object', function() {

        var device;

        describe('creating a device object', function() {

            it('it should have all expected values', function() {

                device = new Device(true);
                expect(device.id).to.be.a('string');
                expect(device.open).to.be.a('function');
                expect(device.close).to.be.a('function');
                expect(device.send).to.be.a('function');
                expect(device.set).to.be.a('function');
                expect(device.get).to.be.a('function');
                expect(device.toJSON).to.be.a('function');

            });

            describe('calling open', function() {

                it('it should emit open', function(done) {

                    device.once('open', function() {
                        done();
                    });
                    device.open();

                });

                describe('with a callback', function() {

                    it('it should call the callback', function(done) {

                        device.open(function() {
                            done();
                        });

                    });

                });

            });

            describe('emitting send', function() {

                it('it should emit receive', function(done) {

                    device.once('receive', function() {
                        done();
                    });
                    device.emit('send', []);

                });

            });

            describe('calling send', function() {

                it('it should emit receive', function(done) {

                    device.once('receive', function() {
                        done();
                    });
                    device.send([]);

                });

            });

            describe('calling close', function() {

                it('it should emit close', function(done) {

                    device.once('close', function() {
                        done();
                    });
                    device.close();

                });

                describe('with a callback', function() {

                    it('it should call the callback', function(done) {

                        device.close(function() {
                            done();
                        });

                    });

                });

            });

        });

    });

    describe('with Connection object', function() {

        var device;

        describe('creating a device object', function() {

            it('it should have all expected values', function() {

                device = new Device();
                expect(device.id).to.be.a('string');
                expect(device.open).to.be.a('function');
                expect(device.close).to.be.a('function');
                expect(device.send).to.be.a('function');

            });

            describe('calling open', function() {

                it('it should emit open', function(done) {

                    device.once('open', function() {
                        done();
                    });
                    device.open();

                });

                describe('with a callback', function() {

                    it('it should call the callback', function(done) {

                        device.open(function() {
                            done();
                        });

                    });

                });

            });

            describe('emitting send', function() {

                it('it should emit receive', function(done) {

                    device.once('receive', function() {
                        done();
                    });
                    device.emit('send', []);

                });

            });

            describe('calling send', function() {

                it('it should emit receive', function(done) {

                    device.once('receive', function() {
                        done();
                    });
                    device.send();

                });

            });

            describe('calling close', function() {

                it('it should emit close', function(done) {

                    device.once('close', function() {
                        done();
                    });
                    device.close();

                });

                describe('with a callback', function() {

                    it('it should call the callback', function(done) {

                        device.close(function() {
                            done();
                        });

                    });

                });

            });

            describe('calling connect', function() {

                it('it should emit opening', function(done) {

                    device.once('opening', function() {
                        done();
                    });
                    device.connect();

                });

                it('it should emit open', function(done) {

                    device.once('open', function() {
                        done();
                    });
                    device.connect();

                });

                it('it should a new connection property with a generated id', function(done) {

                    device.once('open', function() {
                        expect(device.connection).to.be.an('object');
                        expect(device.connection.id).to.be.a('string');

                        done();
                    });
                    device.connect();

                });

                describe('with a callback', function() {

                    var device2 = new Device();

                    it('it should call the callback', function(done) {

                        device2.connect(function() {
                            done();
                        });

                    });

                });

            });

            describe('calling disconnect', function() {

                it('it should emit closing', function(done) {

                    device.once('closing', function() {
                        done();
                    });
                    device.disconnect();

                });

                it('it should emit close', function(done) {

                    device.once('close', function() {
                        done();
                    });
                    device.disconnect();

                });

                describe('with a callback', function() {

                    it('it should call the callback', function(done) {

                        var device2 = new Device();

                        device2.disconnect(function() {
                            done();
                        });

                    });

                });

            });

        });

    });

});