export class Api {
	private _sessionId: string = "";
	get sessionId() {
		return this._sessionId;
	}
	set sessionId(newValue: string) {
		localStorage.setItem('api-session-id', newValue);
		this._sessionId = newValue;
	}

	private _phoneNumber = "";
	get phoneNumber() {
		return this._phoneNumber;
	}
	set phoneNumber(newPhone: string) {
		localStorage.setItem('api-phone-number', newPhone);
		this._phoneNumber = newPhone;
	}

	constructor() {
		let storedSessionId = localStorage.getItem('api-session-id');
		if (storedSessionId) {
			this._sessionId = storedSessionId;
		}

		let storedPhone = localStorage.getItem('api-phone-number');
		if (storedPhone) {
			this._phoneNumber = storedPhone;
		}
	}

	async requestCode(phoneNumber: string): Promise<boolean> {
		phoneNumber = phoneNumber.replace(/[^0-9]/ig, '');
		if (phoneNumber.length !== 10) return false;

		this.phoneNumber = phoneNumber;

		let response = await fetch('/phonenumber/' + phoneNumber, {
			method: 'POST'
		})

		if (response.status < 200 || response.status >= 300) {
			return false;
		}

		let data = await response.json();

		return data.message == "code sent";
	}

	async checkCode(code: string): Promise<boolean> {
		code = code.replace(/[^0-9]/ig, '');
		if (code.length !== 6) return false;

		let response = await fetch('/code/' + this.phoneNumber + "/" + code, {
			method: 'POST'
		});

		if (response.status < 200 || response.status >= 300) {
			return false;
		}

		let data = await response.json();
		if (data.sessionid) {
			this.sessionId = data.sessionId;
			console.log(this.sessionId);
			return true;
		}

		
		return false;
	}

	logOut() {
		this.sessionId = '';
		this.phoneNumber = '';
	}

	async setAddress(address: string): Promise<string> {
		console.log(encodeURIComponent(address));
		let response = await fetch('/v1/address/' + encodeURIComponent(address), {
			method: 'POST'
		});

		if (response.status < 200 || response.status >= 300) {
			return ""
		}

		let data = await response.json();
		return data.address;
	}
}