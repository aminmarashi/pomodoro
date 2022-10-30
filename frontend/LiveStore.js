class LiveStore {
    constructor({ topic, messaging, url = '/api' }) {
        this.store = {};
        this.topic = topic;
        this.messaging = messaging;
        this.url = url;
        this.id = Math.random().toString(36).substring(2);
    }

    async init() {
        await this.reload();
        this.handlePushMessage();
    }

    async reload() {
        const oldStore = this.store;
        const newStore = await this.get(this.topic);
        if (oldStore.timestamp >= newStore.timestamp) return;
        this.emitOnStoreUpdate(oldStore, newStore);
    }

    async get() {
        const store = await idbKeyval.get(this.topic) || {};
        this.store = store;
        return store;
    }

    async requestUpdate(change = {}) {
        const { topic, id } = this;

        await this.saveToStore({ ...change, timestamp: new Date().getTime() });

        this.post('/send', { topic, message: { topic, id, store: this.store } });
    }

    async sendNotification(notification) {
        const { topic } = this;
        this.post('/send', { topic, notification });
    }

    async subscribe() {
        const { messaging, topic } = this;
        return new Promise((resolve, reject) => {
            // Initialize Firebase
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    messaging.getToken().then((token) => {
                        if (token) {
                            this.post('/subscribe', { token, topic }).then(resolve).catch(reject);
                        } else {
                            reject('No Instance ID token available. Request permission to generate one.');
                        }
                    }).catch((err) => {
                        reject('An error occurred while retrieving token. ', err);
                    });
                } else {
                    reject('Unable to get permission to notify.');
                }
            });
        });
    }

    handlePushMessage() {
        this.messaging.onMessage(async ({ data }) => {
            if (!data) return;
            const oldStore = this.store;

            const { topic, id, store } = JSON.parse(data.message);
            if (id === this.id || oldStore.timestamp > store.timestamp) return;

            await this.saveToStore(store);
            this.emitOnStoreUpdate(oldStore, store);
        });
    }

    async saveToStore(change) {
        const { topic } = this;

        const currentStore = await this.get(this.topic);

        const store = { ...currentStore, ...change };

        this.store = store;

        return idbKeyval.set(topic, store);
    }

    emitOnStoreUpdate(oldStore, newStore) {
        if (typeof this.onStoreUpdate === 'function') {
            this.onStoreUpdate(oldStore, newStore);
        }
    }

    post(path, data) {
        const { url } = this;
        return fetch(`${url}${path}`, {
            method: 'POST',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
    }
}