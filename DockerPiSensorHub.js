const i2c = require('i2c-bus');

module.exports = function dockerPiSensorHub(params = {}) {
   const deviceBus = (params && params.deviceBus) || 1;
   const deviceAddress = (params && params.deviceAddress) || 0x17;
   const addresses = {
      "status": 0x04,
      "sensorError": 0x07,
      "lightL": 0x02,
      "lightH": 0x03,
      "BMP280temp": 0x08,
      "BMP280pressureL": 0x09,
      "BMP280pressureM": 0x0a,
      "BMP280pressureH": 0x0b,
      "BMP280status": 0x0c,
      "externalTemp": 0x01,
      "temp": 0x05,
      "humidity": 0x06,
      "movement": 0x0d
   };
   let controller;
   try {
      controller = i2c
   } catch (err) { }
   let lastValues;

   async function read() {
      if (!controller || !controller.openPromisified) return console.error('[dockerPiSensorHub] UNABLE TO CONNECT', { controller, deviceBus, deviceAddress });

      try {
         const bus = await controller.openPromisified(deviceBus);
         if (!bus || !bus.readByte) return console.error('[dockerPiSensorHub] UNABLE TO ACCESS BUS', { controller, deviceBus, deviceAddress });

         let values = {};
         for (let key in addresses) {
            values[key] = await bus.readByte(deviceAddress, addresses[key]);
         }

         values.externalIsMissing = values.status & 0x02 ? true : false;
         if (values.externalIsMissing) values.externalTemp = false;

         values.light = (values.lightH << 8 | values.lightL)
         if (values.lightL === 0 && values.lightH === 255) values.light = -1;
         else if (values.lightL === 255 && values.lightH === 255) values.light = -1;
         values.light++;
         values.pressure = (values.BMP280pressureL | (values.BMP280pressureM << 8) | (values.BMP280pressureH << 16))

         lastValues = values;
         return values;

      } catch (err) {
         console.error('[dockerPiSensorHub] ERROR', err);
         return false;
      }
   }

   return { read, controller, lastValues }
}