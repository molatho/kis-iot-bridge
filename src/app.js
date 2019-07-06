const express = require('express');
const expressWs = require('express-ws');
var app = express();
var wss = expressWs(app).getWss();
const OpcUaBridge = require('./Bridges/OPCUA');
const TPLinkBridge = require('./Bridges/TPLink');
const MqttProxyBridge = require('./Bridges/MQTTProxy');

const sendUpdates = function (thing) {
    wss.clients.forEach(function each(ws) { ws.send(JSON.stringify(thing)); });
}
//Initialize bridges
var opcUaBridge = new OpcUaBridge();
opcUaBridge.onValueChanged = (name, value) => { sendUpdates(opcUaBridge.thing); };
opcUaBridge
    .connect({ url: 'opc.tcp://PI-IAS-005:4840' })
    //.connect({ url: 'opc.tcp://192.168.10.184:4840' })
    .then((bridge) => {
        console.log("Connected to OPCUA");
    })
    .catch((err) => console.error(err));
var tpLinkBridge = new TPLinkBridge();
tpLinkBridge.onValueChanged = (name, value) => { sendUpdates(tpLinkBridge.thing); };
tpLinkBridge
    .connect({url: '192.168.10.159'})
    .then((bridge)=>{
        console.log("Connected to TPLink");
    })
    .catch((err)=> console.error(err));
var mqttProxyBridge = new MqttProxyBridge();
mqttProxyBridge.onValueChanged = (name, value) => { sendUpdates(mqttProxyBridge.thing); };
mqttProxyBridge
    .connect({ api_url: 'http://192.168.10.194:8080', ws_url: 'ws://192.168.10.194:9090'})
    .then((bridge)=> {
        console.log("Connected to MqttProxy");
    })
    .catch((err)=>console.error(err));

const devices = [opcUaBridge, tpLinkBridge, mqttProxyBridge];

//Define routes
app.get('/api/devices', (req,res) => {
    var things = devices.map(d => d.thing); 
    res.send(things);
});

app.ws('/api/live', (ws, req) => {
    console.log(`New WS client ${ws._socket.remoteAddress}`);
});

app.post('/api/set/:device/:attribute/:value', (req, res)=> {
    var devs = devices.filter(x => x.thing.name == req.params.device);
    if (!devs || !devs.length) return res.status(403).send({error: 'Invalid device'});
    var device = devs[0];
    var attrs = device.thing.attributes.filter(x => x.name == req.params.attribute);
    if (!attrs || !attrs.length) return res.status(403).send({error: 'Invalid attribute'});
    var attr = attrs[0];
    device.changeValue(attr, req.params.value, (err, status) => {
        if (err) return res.status(400).send(err);
        res.status(200).send(status);
    });
});

// HIT IT!
app.listen(8080, "192.168.10.104", () => { console.log("Started server"); });
