module.exports = class IBridge {
    constructor() {

    }

    /**
     * Connects to the given backend; returns a promise about whether connection was succesfull
     *
     * @param {*} options
     * @memberof IBridge
     */
    connect(options) {
        throw new Error('VIRTUAL CALL');
    }

    disconnect() {
        throw new Error('VIRTUAL CALL');
    }

    changeValue(attribute, newValue) {
        throw new Error('VIRTUAL CALL');
    }
}