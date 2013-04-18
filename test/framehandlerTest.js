var expect = require('expect.js'),
    FrameHandler = require('./fixture/framehandler'),
    Device = require('./fixture/device');

describe('FrameHandler', function() {

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

  var device = new Device();
  var framehandler = new FrameHandler(device);

  before(function(done) {
    device.open(done);
  });

  describe('emitting send', function() {

    it('it should emit send on device', function(done) {

      device.once('send', function() {
        done();
      });
      framehandler.emit('send', []);

    });

  });

  describe('calling send', function() {

    it('it should emit send on device', function(done) {

      device.once('send', function() {
        done();
      });
      framehandler.send([]);

    });

  });

  describe('receiving data from device', function() {

    it('it should emit receive', function(done) {

      framehandler.once('receive', function() {
        done();
      });
      device.send([]);

    });

  });

});