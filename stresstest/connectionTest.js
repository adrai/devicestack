var Device = require('../test/fixture/device');

var device = new Device();

var counterCon = 0
  , counterDis = 0;

(function run() {
	device.once('open', function() {
		device.connection.on('connect', function() {
			counterCon++;
			console.log('connected ' + counterCon + ' times!');
			device.disconnect(function() {
				counterDis++;
				console.log('disconnected ' + counterDis + ' times!');
				run();
			});
		});
	});
	device.connect();
})();