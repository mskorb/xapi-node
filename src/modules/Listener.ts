export class Listener {

	constructor() {}

	private _listeners: any = {};
	public get listeners() {
		return this._listeners;
	}

	public addListener(listenerId: string, callBack: any, key: string = undefined) {
		if (typeof(callBack) !== "function") {
			return;
		}
		if (this._listeners[listenerId] === undefined) {
			this._listeners[listenerId] = {};
		}
		if (key === undefined) {
			key = "ID" + Object.keys(this._listeners[listenerId]).length;
		}
		this._listeners[listenerId][key] = callBack;
	}

	public callListener(listenerId: string, params: any[] = []) {
		Object.keys(this._listeners[listenerId]).forEach((key: string) => {
			this._listeners[listenerId][key](...params);
		});
	}

}