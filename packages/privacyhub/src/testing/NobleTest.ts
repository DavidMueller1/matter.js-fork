// Read the battery level of the first found peripheral exposing the Battery Level characteristic

import noble, { Peripheral } from "@stoprocent/noble";

// eslint-disable-next-line @typescript-eslint/no-misused-promises
noble.on('stateChange', async (state: string) => {
    if (state === 'poweredOn') {
        await noble.startScanningAsync(['180f'], false);
    }
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
noble.on('discover', async (peripheral: Peripheral) => {
    console.log("FOUND SOMETING");
    console.log(JSON.stringify(peripheral));
    // await noble.stopScanningAsync();
    // await peripheral.connectAsync();
    // const {characteristics} = await peripheral.discoverSomeServicesAndCharacteristicsAsync(['180f'], ['2a19']);
    // const batteryLevel = (await characteristics[0].readAsync())[0];
    //
    // console.log(`${peripheral.address} (${peripheral.advertisement.localName}): ${batteryLevel}%`);
    //
    // await peripheral.disconnectAsync();
    // process.exit(0);
});