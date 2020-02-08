const SensorHub = require('./DockerPiSensorHub');

const hub = new SensorHub();

if (!hub || !hub.read) throw new Error('Unable to init the hub.');
const values = await hub.read();
console.log('There are the sensorHub values:', values);