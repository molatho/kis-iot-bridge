import IBridge from '../bridge'
import mqtt from 'mqtt'


export default class MqttBridge extends IBridge {
    constructor() {
        super();
        this._client = null;
    }

    connect(options) {
        return new Promise((resolve, reject) => {
            try {
                this._client = mqtt.connect(options.url, { clientId: options.clientId || 'mqtt-bridge' });
                this._client.on('connect', () => {
                    this._client.subscribe('#', (err) => {
                        if (err) return reject(err);
                        return resolve(this);
                    });
                });
                this._client.on('message', this.processMessage);
            } catch (err) {
                reject(err);
            }
        })
    }

    disconnect() {
        if (this._client.connected) this._client.end(true);
    }

    processMessage(topic, message) {
        console.log(`[MQTT] ${topic}: ${message.toString()}`);
    }
}