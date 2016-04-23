'use strict'

class Exception extends Error {
    constructor(message) {
        super(message);
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

class ArgumentException extends Exception {
    constructor(message) {
        super(message);
    }
}

module.exports = {
    Exception,
    NotFoundException,
    NotImplementedException,
    ArgumentException
};
