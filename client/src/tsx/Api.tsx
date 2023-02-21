export class Api {
	private _sessionId:string = "";
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
		this.phoneNumber = phoneNumber;

		let result = await fetch('/auth/getcode', {
			method: 'POST',
			headers: {
				'Content-Type': 'Application/JSON'
			},
			body: JSON.stringify({
				phone_number: phoneNumber
			})
		})
		let data = await result.json();

		return data.status && data.status == 'sent';
	}

	async checkCode(code: string): Promise<boolean> {
		let result = await fetch('/auth/checkcode', {
			method: 'POST',
			headers: {
				'Content-Type': "Application/JSON"
			},
			body: JSON.stringify({
				phone_number: this.phoneNumber,
				code: code
			})
		});
		let data = await result.json();
		if (data.id) {
			this.sessionId = data.id;
			return true;
		}
		return false;
	}

	logOut() {
		this.sessionId = '';
		this.phoneNumber = '';
	}
}