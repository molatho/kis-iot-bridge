const IBridge = require('../bridge');
const opcua = require('node-opcua');
const Thing = require('../../Model/thing');
const ThingAttribute = require('../../Model/thing-attribute');
const ATTRIBUTE_TYPE = require('../../Model/attribute-type');
const WebSocket = require('ws');
const rq = require('request-promise')

module.exports = class MqttProxy extends IBridge {
    constructor() {
        super();
        this._client = null;
        this.onValueChanged = null;
        this._api_url;

        this.thing = new Thing();
        this.thing.name = 'AC';
        var ipAddress = new ThingAttribute();
        ipAddress.name = 'IP-Address';
        ipAddress.value = '192.168.10.194';
        ipAddress.type = ATTRIBUTE_TYPE.DisplayOnly;
        var brokerAddress = new ThingAttribute();
        brokerAddress.name = 'Target';
        brokerAddress.value = 'n/a';
        brokerAddress.type = ATTRIBUTE_TYPE.DisplayOnly;
        var clientName = new ThingAttribute();
        clientName.name = 'Client Name';
        clientName.value = 'n/a';
        clientName.type = ATTRIBUTE_TYPE.DisplayOnly;
        var temperature = new ThingAttribute();
        temperature.name = 'Temperature';
        temperature.value = '0';
        temperature.type = ATTRIBUTE_TYPE.DisplayOnly;
        var override = new ThingAttribute();
        override.name = 'Override';
        override.value = 'Off';
        override.type = ATTRIBUTE_TYPE.Toggle;
        override.toggleOptions = ['On', 'Off'];
        this.thing.attributes = [ipAddress, brokerAddress, clientName, temperature, override];
    }

    connect(options) {
        //Connect: REST
        //Connect: WS
        this._api_url = options.api_url;
        return rq({
            uri: options.api_url + '/api/manager/all',
            json: true
        })
            .then((data) => {
                this.thing.attributes[1].value = data.client1.clientOut.options.ChannelOptions.Server;
                this.thing.attributes[2].value = data.client1.clientOut.options.ClientId;
                this.thing.attributes[3].value = '0';
                this.thing.attributes[4].value = 'Off';
                return rq({
                    url: options.api_url + '/api/policy/all',
                    json: true
                })
            })
            .then((data)=> {
                this.thing.attributes[4].value = data.length == 0;
                this._client = new WebSocket(options.ws_url);
                this._client.on('open', () => {
                    return this;
                });
                this._client.on('message', function (data) { this.processMessage(data); }.bind(this));
            })
    }

    disconnect() {
        if (this._client.readyState == WebSocket.OPEN) this._client.close();
    }

    processMessage(data) {
        console.log(`[MQTTProxy] Data: ${data.toString()}`);
        data = JSON.parse(data);
        var temp = parseInt(data.PayloadString) || -1337;
        if (temp == -1337 || temp.toString() == this.thing.attributes[3].value) return;
        this.thing.attributes[3].value = temp.toString();
        this.onValueChanged(this.thing.attributes[3].value, temp.toString());
    }

    changeValue(attribute, newValue, callback) {
        if (attribute.name != 'Override') return callback(new Error(`Can not change value of ${attribute.name}`));
        if (newValue != 'On' && newValue != 'Off') return callback(new Error(`Invalid value ${newValue}`));
        if (newValue == 'On') {
            rq({
                url: this._api_url + '/api/policy/toggle/on',
                method: 'POST'
            })
                .then((resp) => {
                    this.thing.attributes[4].value = newValue;
                    this.onValueChanged(this.thing.attributes[4].value, newValue);
                    callback();
                })
                .catch(callback);
        } else {
            rq({
                url: this._api_url + '/api/policy/toggle/off',
                method: 'POST'
            })
                .then((resp) => {
                    this.thing.attributes[4].value = newValue;
                    this.onValueChanged(this.thing.attributes[4].value, newValue);
                    callback();
                })
                .catch(callback);
        }
    }
}