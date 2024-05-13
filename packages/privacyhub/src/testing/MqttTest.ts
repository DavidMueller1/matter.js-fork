import mqtt from "mqtt";

const client = mqtt.connect({
    host: "philipinator.dns.army",
    port: 1883,
    username: 'mqtt_user',
    password: 'mqtt-docker'
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