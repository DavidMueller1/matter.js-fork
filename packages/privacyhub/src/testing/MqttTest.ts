import mqtt from "mqtt";

const client = mqtt.connect("mqtt://test.mosquitto.org:1883", {
    username: '',
    password: ''
});
console.log("Connecting to MQTT broker");

client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe("bier", (err: any) => {
        if (!err) {
            client.publish("schnapps", "Cheers");
        }
    });
});

client.on("message", (_, message: any) => {
    // message is Buffer
    console.log(message.toString());
    client.end();
});