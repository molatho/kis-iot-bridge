const IBridge = require('../bridge');
const opcua = require('node-opcua');
const Thing = require('../../Model/thing');
const ThingAttribute = require('../../Model/thing-attribute');
const ATTRIBUTE_TYPE = require('../../Model/attribute-type');

module.exports = class OpcUaBridge  {
    constructor() {
        //super();
        this.onValueChanged = null;
        this._client = null;
        this._session = null;
        this._items = [
            {
                nodeId: 'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.PLC_PRG.motor_off',
                name: 'motor_off',
                item: null
            },
            {
                nodeId: 'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.PLC_PRG.motor_on',
                name: 'motor_on',
                item: null
            },
            {
                nodeId: 'ns=4;s=|var|CODESYS Control for Raspberry Pi SL.Application.PLC_PRG.motor_stat',
                name: 'motor_stat',
                item: null
            }
        ];
        this._subscription = null;

        this.thing = new Thing();
        this.thing.name = 'Motor';
        var ipAddress = new ThingAttribute();
        ipAddress.name = 'IP-Address';
        ipAddress.value = 'n/a';
        ipAddress.type = ATTRIBUTE_TYPE.DisplayOnly;
        var motorStatus = new ThingAttribute();
        motorStatus.name = 'Status';
        motorStatus.value = 'Off';
        motorStatus.type = ATTRIBUTE_TYPE.Toggle;
        motorStatus.toggleOptions = ['Off', 'On'];
        this.thing.attributes = [ipAddress, motorStatus];
    }

    connect(options) {
        this.thing.attributes[0].value = options.url;
        return new Promise((resolve, reject) => {
            try {
                this._client = new opcua.OPCUAClient();
                this._client.connect(options.url, (err) => {
                    if (err) return reject(err);
                    this._client.createSession((err, session) => {
                        if (err) return reject(err);
                        this._session = session;
                        this._subscription = new opcua.ClientSubscription(session, {
                            requestedPublishingInterval: 100,
                            publishingEnabled: true
                        });
                        for (var i in this._items) {
                            this._items[i].item = this._subscription.monitor({
                                nodeId: this._items[i].nodeId,
                                attributeId: opcua.AttributeIds.Value
                            });
                            (function (item) {
                                item.item.on('changed', (value) => {
                                    this.processUpdate(item, value.value.value);
                                });
                            }.bind(this))(this._items[i]);
                        }
                        return resolve(this);
                    })
                });
            } catch (err) {
                reject(err);
            }
        });
    }

    processUpdate(item, newValue) {
        console.log(`[OPC/UA] ${item.nodeId.substr(item.nodeId.lastIndexOf('.'))}: ${newValue}`);
        if (item.name == 'motor_stat') {
            this.thing.attributes[1].value = newValue == true ? 'On' : 'Off';
            if (this.onValueChanged) this.onValueChanged(item.name, newValue);
        }
    }
    
    changeValue(attribute, newValue, callback) {
        var node = [
            {
                nodeId: this._items[2].nodeId,
                attributeId: opcua.AttributeIds.Value,
                value:{
                    value: {
                        dataType: opcua.DataType.Boolean,
                        value: newValue == 'On' ? true : false
                    }
                }
            }
        ];
        this._session.write(node, callback);
    }
}