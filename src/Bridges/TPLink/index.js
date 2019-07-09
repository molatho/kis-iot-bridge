const IBridge = require('../bridge');
const TPLink = require('tplink-smartplug-node');
const Thing = require('../../Model/thing');
const ThingAttribute = require('../../Model/thing-attribute');
const ATTRIBUTE_TYPE = require('../../Model/attribute-type');

module.exports = class TPLinkBridge  {
    constructor() {
        //super();
        this.onValueChanged = null;

        this._url = '';
        this._interval = null;

        this.thing = new Thing();
        this.thing.name = 'Power Plug';
        var ipAddress = new ThingAttribute();
        ipAddress.name = 'IP-Address';
        ipAddress.value = 'n/a';
        ipAddress.type = ATTRIBUTE_TYPE.DisplayOnly;
        var swVersion = new ThingAttribute();
        swVersion.name = 'Version';
        swVersion.value = 'n/a';
        swVersion.type = ATTRIBUTE_TYPE.DisplayOnly;
        var model = new ThingAttribute();
        model.name = 'Model';
        model.value = 'n/a';
        model.type = ATTRIBUTE_TYPE.DisplayOnly;
        var relaisStatus = new ThingAttribute();
        relaisStatus.name = 'Status';
        relaisStatus.value = 'Off';
        relaisStatus.type = ATTRIBUTE_TYPE.Toggle;
        relaisStatus.toggleOptions = ['Off', 'On'];
        this.thing.attributes = [ipAddress, swVersion, model, relaisStatus];
    }

    connect(options) {
        this._url = options.url;
        return new Promise((resolve, reject) => {
            try {
                var tp = new TPLink(this._url, (err) => {
                    if (err) return reject(err);
                    this.thing.attributes[0].value = this._url;

                    tp.getInfo((parsed, resp) => {
                        if (!parsed) return reject(new Error("Could not parse getInfo"));
                        this.thing.attributes[1].value = resp.system.get_sysinfo.sw_ver;
                        this.thing.attributes[2].value = resp.system.get_sysinfo.model;
                        this.thing.attributes[3].value = resp.system.get_sysinfo.relay_state == 1 ? 'On' : 'Off';
                        resolve(this.thing);
                    });
                });
                this._interval = setInterval(()=> {
                    var tp = new TPLink(this._url, (err) => {
                        if (err) return reject(err);
                        this.thing.attributes[0].value = this._url;
    
                        tp.getInfo((parsed, resp) => {
                            if (!parsed) return reject(new Error("Could not parse getInfo"));
                            this.thing.attributes[1].value = resp.system.get_sysinfo.sw_ver;
                            this.thing.attributes[2].value = resp.system.get_sysinfo.model;
                            var val = resp.system.get_sysinfo.relay_state == 1 ? 'On' : 'Off';
                            if (this.thing.attributes[3].value != val){
                                this.thing.attributes[3].value = val;
                                if (this.onValueChanged) this.onValueChanged(this.thing.attributes[3].name, 'On');
                            }
                        });
                    });
                }, 500);
            } catch (err) {
                reject(err);
            }
        });
    }

    processUpdate(item, newValue) {
        // console.log(`[TPLink] ${item.nodeId.substr(item.nodeId.lastIndexOf('.'))}: ${newValue}`);
        // if (item.name == 'motor_stat') {
        //     this.thing.attributes[1].value = newValue == true ? 'On' : 'Off';
        //     if (this.onValueChanged) this.onValueChanged(item.name, newValue);
        // }
    }
    
    changeValue(attribute, newValue, callback) {
        if (attribute.name != 'Status') return callback(new Error(`Invalid attribute ${attribute}`));
        if (newValue != 'On' && newValue != 'Off') return callback(new Error(`Invalid value ${newValue}`));
        

        var tp = new TPLink(this._url, (err) => {
            if (err) return callback(err);
            if (newValue == 'On') tp.turnOn((parsed,resp) => 
            {
                if (!parsed) return callback(new Error("Failed parsing"));
                callback();
                this.thing.attributes[3].value = 'On';
                if (this.onValueChanged) this.onValueChanged(this.thing.attributes[3].name, 'On');
            });
            else tp.turnOff((parsed,resp) => 
            {
                if (!parsed) return callback(new Error("Failed parsing"));
                callback();
                this.thing.attributes[3].value = 'Off';
                if (this.onValueChanged) this.onValueChanged(this.thing.attributes[3].name, 'On');
            });
        });
    }
}