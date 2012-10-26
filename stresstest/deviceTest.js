var Device = require('../test/fixture/device');

var device = new Device();

var counterOpen = 0
  , counterClose = 0;

(function run() {
	device.on('close', function() {
		counterClose++;
		console.log('closed ' + counterClose + ' times!');

	});
	device.on('open', function() {
		counterOpen++;
		console.log('opened ' + counterOpen + ' times!');

		device.close(function() {
			run();
		});
	});

	device.open();
})();