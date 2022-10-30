let topic = document.location.hash.split('#')[1];

if (!topic) {
    topic = generateTopic();
    document.location.hash = topic;
}

// Your web app's Firebase configuration

const firebaseConfig = {
    apiKey: "AIzaSyDsighbZPEzMXE4zNs9zeOKrPYBj0gt6N8",
    authDomain: "pomodoro-4b027.firebaseapp.com",
    projectId: "pomodoro-4b027",
    storageBucket: "pomodoro-4b027.appspot.com",
    messagingSenderId: "1076391733143",
    appId: "1:1076391733143:web:9a8741d0b8ae20628bc6d2"
};


firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const $timer = document.querySelector('#timer');

function generateTopic() {
    return Math.random().toString(36).substring(9);
}

class App extends preact.Component {
    componentDidMount() {
        this.liveStore = new LiveStore({ messaging, topic });
        this.liveStore.init();
        this.isNotificationFailed = false;
        this.liveStore.subscribe().catch(() => {
            this.isNotificationFailed = true;
        });
        this.timer = new Timer(this.liveStore);

        // Rerender on timer update
        this.timer.onUpdate = () => this.forceUpdate();

        // Bind actions
        this.start = this.timer.start.bind(this.timer);
        this.pause = this.timer.pause.bind(this.timer);
        this.reset = this.timer.reset.bind(this.timer);
        this.sync = this.liveStore.subscribe.bind(this.liveStore);
        this.onTypeChange = this.timer.setType.bind(this.timer);
        this.onTimeChange = this.timer.setTypeToSeconds.bind(this.timer);
        this.onResetTypes = this.timer.resetTypeToSeconds.bind(this.timer);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) return;
            this.liveStore.reload();
        });
    }

    render() {
        if (!this.timer) return html`<div class="progress">
            <div class="indeterminate"></div>
        </div>`;

        return html`<div class="container">
            <div class="row">
                <h1 class="center-align">
                    <${TimeDisplay} time=${this.timer.display}/>
                </h1>
            </div>
            <div id="type-selector" class="row valign-center">
                <${TypeSelector}
                    onTypeChange=${this.onTypeChange}
                    onTimeChange=${this.onTimeChange}
                    onResetTypes=${this.onResetTypes}
                    type=${this.timer.type}
                    typeToSeconds=${this.timer.typeToSeconds}
                />
            </div>
            <div class="row">
                <div class="center-align">
                    <button
                        class="waves-effect waves-light btn-small"
                        onClick=${this.start}
                        disabled=${this.timer.running}
                    >
                        Start
                    </button>
                    <button
                        class="waves-effect waves-light btn-small"
                        onClick=${this.pause}
                        disabled=${!this.timer.running}
                    >
                        Pause
                    </button>
                    <button
                        class="waves-effect waves-light btn-small"
                        onClick=${this.reset}
                    >
                        Reset
                    </button>
                    ${this.isNotificationFailed ?
                html`
                        <button
                            class="waves-effect waves-light btn-small"
                            onClick=${this.sync}
                        >
                            Sync
                        </button>
                    ` :
                html``
            }
                </div>
            </div>
            <div class="row center-align">
                <img src="https://chart.googleapis.com/chart?cht=qr&chs=177x177&chld=H&chl=${document.location.toString().replace('#', '%23')}" />
            </div>
        </div>`;
    }

}

preact.render(preact.h(App), document.getElementById('app'));
