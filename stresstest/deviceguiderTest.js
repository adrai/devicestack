var deviceguider = require('../test/fixture/deviceguider');

var counterCon = 0
  , counterDis = 0
  , counterPlug = 0;

deviceguider.on('disconnect', function(connection) {
	counterDis++;
	console.log('disconnected ' + counterDis + ' times!');
});

deviceguider.on('plug', function(plug) {
	counterDis++;
	console.log('pluged ' + counterDis + ' times!');
});

deviceguider.on('connect', function(connection) {
	counterCon++;
	console.log('connected ' + counterCon + ' times!');

	deviceguider.manualconnect(function() {
		deviceguider.autoconnectOne();
	});
});

deviceguider.autoconnectOne();