'use strict'


class Exception {
    constructor(message) {
        this.message = message;
    }
}

class NotFoundException extends Exception {
    constructor(message) {
        super(message);
    }
}

class NotImplementedException extends Exception {
    constructor(message) {
        super(message);
    }
}


module.exports = {
    Exception,
    NotFoundException,
    NotImplementedException
};
