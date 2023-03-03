type GetCoordsCallback = (lnglat: number[]) => void;

export class Api {
	private _sessionId: string = "";
	get sessionId() {
		return this._sessionId;
	}
	set sessionId(newValue: string) {
		if (typeof newValue !== 'undefined') {
			localStorage.setItem('api-session-id', newValue);
		}
		this._sessionId = newValue;
	}

	phoneNumber: string = "";
	coords: number[] = [];
	address: string = "";

	constructor() {
		let storedSessionId = localStorage.getItem('api-session-id');

		if (storedSessionId) {
			storedSessionId = storedSessionId.replace(/[^a-z0-9\-]/ig, '');

			if (storedSessionId.length == 36) {
				this._sessionId = storedSessionId;
			}
		}
	}

	private async fetchWithSessionId(url: string, method: string, body?: any): Promise<Response> {
		let opts: RequestInit = {
			method,
			headers: {
				'X-Session-Id': this.sessionId
			}
		}

		if (typeof body == 'object' && opts.headers) {
			opts.headers['Content-Type'] = 'Application/JSON';
			opts.body = JSON.stringify(body);
		}

		let response = await fetch(url, opts);

		return response;
	}

	async getPhoneNumber(): Promise<string> {
		if (!this.sessionId) {
			return "";
		}

		let response = await this.fetchWithSessionId('/v1/phonenumber', 'GET');
		if (response.status < 200 || response.status >= 300) {
			return "";
		}

		let { phonenumber } = await response.json();
		this.phoneNumber = phonenumber;
		return phonenumber;
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
			this.sessionId = data.sessionid;
			console.log(this.sessionId);
			return true;
		}


		return false;
	}

	logOut() {
		this.sessionId = '';
		this.phoneNumber = '';
	}

	async getAddress(): Promise<string> {
		if (!this.sessionId) {
			return ""
		}

		let response = await this.fetchWithSessionId('/v1/address', 'GET')
		if (response.status < 200 || response.status >= 300) {
			return "";
		}

		let { address } = await response.json();
		this.address = address;
		this.run('getaddress', this.address);

		return address;
	}
	async setAddress(address: string): Promise<string> {
		if (!this.sessionId) {
			return ""
		}

		let response = await this.fetchWithSessionId('/v1/address', 'POST', { address })

		if (response.status < 200 || response.status >= 300) {
			return ""
		}

		let data = await response.json();
		this.address = data.address;
		this.run('getaddress', this.address);

		return data.address;
	}

	async getCoords(): Promise<number[]> {
		if (!this.sessionId) {
			return []
		}

		let response = await this.fetchWithSessionId('/v1/coords', 'GET');

		if (response.status < 200 || response.status >= 300) {
			return []
		}

		let data = await response.json();
		

		this.coords = data.coords;
		this.run('getcoords', this.coords);

		return data.coords;
	}

	private _callbacks: { [actionName: string]: Array<(...any)=>void>; } = {};

	async on(action: ActionTypes, cb: (...any)=>void) {
		this._callbacks[action] || (this._callbacks[action] = []);
		this._callbacks[action].push(cb);
	}

	async remove(action: ActionTypes, cb: any) {
		this._callbacks[action] && this._callbacks[action].splice(this._callbacks[action].indexOf(cb), 1);
	}

	async run(action: ActionTypes, ...args) {
		this._callbacks[action] && this._callbacks[action].forEach(cb => cb(...args));
	}
}

type ActionTypes = 'getcoords' | 'getaddress';