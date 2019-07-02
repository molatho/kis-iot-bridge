const ATTRIBUTE_TYPES = require('./attribute-type');

module.exports = class ThingAttribute { 
    constructor() {
        this.name = '';
        this.value = '';
        this.type = ATTRIBUTE_TYPES.DisplayOnly;
        this.toggleOptions = [];
        this.range = [];
    }
}