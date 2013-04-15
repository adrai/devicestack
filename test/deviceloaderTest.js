var expect = require('expect.js'),
    deviceloader = require('./fixture/deviceloader').create();

describe('DeviceLoader', function() {

  after(function() {
    var pm;

    try {
      pm = require('pm-notify');
    } catch(e) {}

    if (pm) {
      pm.stopMonitoring();
    }
  });

  describe('having a deviceloader object', function() {

    it('it should have all expected values', function() {

      expect(deviceloader.lookup).to.be.a('function');
      expect(deviceloader.trigger).to.be.a('function');
      expect(deviceloader.startLookup).to.be.a('function');
      expect(deviceloader.stopLookup).to.be.a('function');

    });

    describe('calling lookup', function() {

      it('it should return a device array', function(done) {

        deviceloader.lookup(function(err, devices) {
          expect(devices).to.be.an('array');
          done();
        });

      });

    });

    describe('calling trigger', function() {

      it('it should call lookup', function(done) {

        deviceloader.once('lookup', function(err, devices) {
          done();
        });
        deviceloader.trigger();

      });

      it('it should return the devices', function(done) {

        deviceloader.trigger(function(err, devices) {
          expect(devices).to.be.an('array');
          expect(devices).to.have.length(2);
          done();
        });

      });

    });

    describe('calling startLookup', function() {

      beforeEach(function() {
        deviceloader.stopLookup();
      });

      it('it should emit plug when a device is added', function(done) {

        deviceloader.once('plug', function(device) {
          done();
        });
        deviceloader.startLookup(10);

      });

      it('it should emit unplug when a device is removed', function(done) {

        deviceloader.once('unplug', function(device) {
          done();
        });
        deviceloader.startLookup(10);
        setTimeout(function() {
          deviceloader.startDevices = [deviceloader.startDevices.slice(0, 1)];
        }, 20);

      });

    });

    describe('calling stopLookup', function() {

      before(function() {
        deviceloader.stopLookup();
      });

      it('it should stop calling lookup', function(done) {

        deviceloader.once('lookup', function() {
          deviceloader.stopLookup();
          deviceloader.once('lookup', function() {
            expect(undefined).to.be.ok();
          });
          setTimeout(function() {
            done();
          }, 20);
        });
        deviceloader.startLookup(10);

      });

    });

  });

});