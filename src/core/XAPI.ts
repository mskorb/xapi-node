import Stream from "./Stream/Stream";
import Socket from "./Socket/Socket";
import Utils from "../utils/Utils";
import {Listener} from "../modules/Listener";

export const DefaultHostname = 'ws.xtb.com';

export interface XAPIConfig {
	accountId ?: string | null,
	password ?: string | null,
	type ?: string | null,
	appName ?: string,
	host ?: string,
	rateLimit ?: number
}

export interface XAPIAccount {
	accountId ?: string | null,
	password ?: string | null,
	type ?: string | null,
	appName ?: string,
	host ?: string,
	session: string
}

export class XAPI extends Listener {

	public Stream: Stream;
	public Socket: Socket;
	private _tryReconnect: boolean = false;
	public get tryReconnect() { return this._tryReconnect; }
	private pingTimer: any = null;
	private _transactionIdIncrement: number = 0;
	private _rateLimit: number = 850;
	public get rateLimit() { return this._rateLimit; }

	constructor({
		accountId = null,
		password = null,
		type = null,
		appName = undefined,
		host = DefaultHostname,
		rateLimit = 850}: XAPIConfig) {
		super();
		this._rateLimit = rateLimit;
		this.Socket = new Socket(this, password);
		this.Stream = new Stream(this);
		if (accountId != null && password != null && type != null) {
			this.setAccount(accountId, type, appName, host);
		}

		this.addListener("xapiReady", () => {
			if (this.pingTimer != null) {
				clearInterval(this.pingTimer);
			}

			this.pingTimer = setInterval(() => {
				if (this.Socket.status) {
					this.Socket.ping();
				}
				if (this.Stream.status) {
					this.Stream.ping();
				}
				setTimeout(() => {
					if (this.Socket.status) {
						this.Socket.send.getServerTime();
					}
				}, 1000);
				setTimeout(() => {
					if (this.Socket.status) {
						this.Socket.send.getTrades();
					}
				}, 2000);
			}, 19000);
		}, "constructor");
	}

	public createTransactionId(): string {
		this._transactionIdIncrement += 1;
		if (this._transactionIdIncrement > 9999) {
			this._transactionIdIncrement = 0;
		}
		return Utils.getUTCTimestamp().toString() + Utils.formatNumber(this._transactionIdIncrement, 4);
	}

	protected account: XAPIAccount = {
		type: "demo",
		accountId: "",
		session: "",
		host: "",
		appName: undefined
	};

	public getAccountType(): string {
		return this.account.type;
	}

	public getAccountID(): string {
		return this.account.accountId;
	}

	public getSession(): string {
		return this.account.session;
	}

	public getAppName(): string {
		return this.account.appName;
	}

	public getHostname(): string {
		return this.account.host;
	}

	protected setAccount(
		accountId: string,
		type: string,
		appName: string = undefined,
		host: string = DefaultHostname) {
		this.account = {
			type:  (type.toLowerCase() === "real") ? "real" : "demo",
			accountId,
			session: "",
			appName,
			host
		};
	}

	public setSession(session: string) {
		this.account.session = session;
		if (this.Stream.status === true && session !== null && session.length > 0) {
			this.Stream.ping();
			this.callListener("xapiReady");
		}
	}

	public connect() {
		this._tryReconnect = true;
		this.Stream.connect();
		this.Socket.connect();
	}

	public get isConnectionReady() {
		return this.Stream.status && this.Socket.status;
	}

	public disconnect() {
		return new Promise((resolve, reject) => {
			this.account.session = '';
			this._tryReconnect = false;
			this.Stream.closeConnection();
			if (this.Socket.status) {
				this.Socket.logout().then(() => {
					this.Socket.closeConnection();
					resolve();
				}).catch(() => {
					this.Socket.closeConnection();
					resolve();
				});
			} else {
				this.Socket.closeConnection();
				resolve();
			}
		});
	}

	public onReady(callBack: () => void, key: string = "default") {
		if (this.getSession().length > 0 && this.isConnectionReady) {
			callBack();
		}
		this.addListener("xapiReady", callBack, key);
	}

	public onConnectionChange(callBack: (status: boolean) => void, key: string = undefined) {
		this.addListener("xapiConnectionChange", callBack, key);
	}

}

export default XAPI;
