const IBridge = require('../bridge');
const opcua = require('node-opcua');
const Thing = require('../../Model/thing');
const ThingAttribute = require('../../Model/thing-attribute');
const ATTRIBUTE_TYPE = require('../../Model/attribute-type');
const WebSocket = require('ws');
const rq = require('request-promise')

module.exports =  class MqttProxy extends IBridge {
    constructor() {
        super();
        this._client = null;
        this.onValueChanged = null;
        
        this.thing = new Thing();
        this.thing.name = 'AC';
        var ipAddress = new ThingAttribute();
        ipAddress.name = 'IP-Address';
        ipAddress.value = '192.168.10.115';
        ipAddress.type = ATTRIBUTE_TYPE.DisplayOnly;
        var temperature = new ThingAttribute();
        temperature.name = 'Temperature';
        temperature.value = '0';
        temperature.type = ATTRIBUTE_TYPE.Range;
        temperature.range = [0, 100];
        this.thing.attributes = [ipAddress, temperature];
    }

    connect(options) {
        //Connect: REST
        //Connect: WS
        return rq({
            uri: options.api_url + '/api/manager/all',
            json: true
        })
        .then((data)=> {
            this.ipAddress.value = 
        })
        new Promise((resolve, reject) => {
            try {
                this._client = new WebSocket(options.ws_url);
                this._client.on('open', () => {
                    return resolve(this);
                });
                this._client.on('message', this.processMessage);
            } catch(err) {
                return reject(err);
            }
        })
    }

    disconnect() {
        if (this._client.readyState == WebSocket.OPEN) this._client.close();
    }

    processMessage(data) {
        console.log(`[MQTTProxy] Data: ${data.toString()}`);
    }

    changeValue(attribute, newValue, callback) {
        //TODO: Implement
        callback();
    }
}