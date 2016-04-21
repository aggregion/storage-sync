export class Exception {
	constructor(message) {
		this.message = message;
	}
}

export class NotFoundException extends Exception {
	constructor(message) {
		super(message);
	}
}

export class NotImplementedException extends Exception {
	constructor(message) {
		super(message);
	}
}

