const stackmat = (function() {
    // Audio processing variables
    let audio_context;
    let audio_stream, source, node;
    let sample_rate;
    let bitAnalyzer;
    let last_power = 1;
    let agc_factor = 0.0001;

    // Signal processing variables
    let lastVal = [];
    let lastSgn = 0;
    const THRESHOLD_SCHM = 0.2;
    const THRESHOLD_EDGE = 0.7;
    let lenVoltageKeep = 0;
    let distortionStat = 0;

    // Bit analysis variables
    let bitBuffer = [];
    let byteBuffer = [];
    let idle_val = 0;
    let last_bit = 0;
    let last_bit_length = 0;
    let no_state_length = 0;

    // State and callbacks
    let stackmat_state = {
        time_milli: 0,
        unit: 10,
        on: false,
        greenLight: false,
        leftHand: false,
        rightHand: false,
        running: false,
        signalHeader: 'I'
    };
    
    let onChargeCallback = null;
    let onStartCallback = null;
    let onStopCallback = null;

    // Get available audio input devices
    function updateInputDevices() {
        const devices = [];
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            return Promise.resolve(devices);
        }

        return navigator.mediaDevices.enumerateDevices().then(function(deviceInfos) {
            for (let i = 0; i < deviceInfos.length; i++) {
                const deviceInfo = deviceInfos[i];
                if (deviceInfo.kind === 'audioinput') {
                    devices.push([deviceInfo.deviceId, deviceInfo.label || 'microphone ' + (devices.length + 1)]);
                }
            }
            return devices;
        });
    }

    // Initialize the stackmat timer
    function init(onCharge, onStart, onStop, deviceId) {
        onChargeCallback = onCharge || function() {};
        onStartCallback = onStart || function() {};
        onStopCallback = onStop || function() {};

        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
        }

        if (navigator.mediaDevices.getUserMedia === undefined) {
            navigator.mediaDevices.getUserMedia = function(constraints) {
                const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
                if (!getUserMedia) {
                    return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
                }
                return new Promise(function(resolve, reject) {
                    getUserMedia.call(navigator, constraints, resolve, reject);
                });
            }
        }

        const AudioContext = (window["AudioContext"] || window["webkitAudioContext"]);
        audio_context = new AudioContext();
        sample_rate = audio_context["sampleRate"] / 1200;
        bitAnalyzer = appendBit;
        
        agc_factor = 0.001 / sample_rate;
        lastVal.length = Math.ceil(sample_rate / 6);
        bitBuffer = [];
        byteBuffer = [];

        const selectObj = {
            "echoCancellation": false,
            "noiseSuppression": false
        };

        if (deviceId) {
            selectObj["deviceId"] = {
                "exact": deviceId
            };
        }

        if (audio_stream == undefined) {
            return navigator.mediaDevices.getUserMedia({
                "audio": selectObj
            }).then(function(stream) {
                if (audio_context.state == 'suspended') {
                    return Promise.reject();
                }
                success(stream);
                return Promise.resolve();
            }).catch(err => {
                console.error("Stackmat initialization error:", err);
                return Promise.reject(err);
            });
        } else {
            return Promise.resolve();
        }
    }

    // Stop the stackmat timer
    function stop() {
        if (audio_stream != undefined) {
            try {
                source["disconnect"](node);
                node["disconnect"](audio_context["destination"]);
                audio_stream["stop"] && audio_stream["stop"]();
            } catch (e) {
                console.error("Error stopping stackmat:", e);
            }
            audio_stream = undefined;
        }
        
        return Promise.resolve();
    }

    // Process audio stream
    function success(stream) {
        audio_stream = stream;
        source = audio_context["createMediaStreamSource"](stream);
        node = audio_context["createScriptProcessor"](1024, 1, 1);

        node["onaudioprocess"] = function(e) {
            const input = e["inputBuffer"]["getChannelData"](0);
            // AGC (Automatic Gain Control)
            for (let i = 0; i < input.length; i++) {
                const power = input[i] * input[i];
                last_power = Math.max(0.0001, last_power + (power - last_power) * agc_factor);
                const gain = 1 / Math.sqrt(last_power);
                procSignal(input[i] * gain);
            }
        };
        
        source["connect"](node);
        node["connect"](audio_context["destination"]);
    }

    // Process incoming signal
    function procSignal(signal) {
        lastVal.unshift(signal);
        const isEdge = (lastVal.pop() - signal) * (lastSgn ? 1 : -1) > THRESHOLD_EDGE &&
            Math.abs(signal - (lastSgn ? 1 : -1)) - 1 > THRESHOLD_SCHM &&
            lenVoltageKeep > sample_rate * 0.6;

        if (isEdge) {
            for (let i = 0; i < Math.round(lenVoltageKeep / sample_rate); i++) {
                bitAnalyzer(lastSgn);
            }
            lastSgn ^= 1;
            lenVoltageKeep = 0;
        } else if (lenVoltageKeep > sample_rate * 2) {
            bitAnalyzer(lastSgn);
            lenVoltageKeep -= sample_rate;
        }
        lenVoltageKeep++;

        // Normalize signal distortion
        if (last_bit_length < 10) {
            distortionStat = Math.max(0.0001, distortionStat + (Math.pow(signal - (lastSgn ? 1 : -1), 2) - distortionStat) * agc_factor);
        } else if (last_bit_length > 100) {
            distortionStat = 1;
        }
    }

    // Analyze bits from the signal
    function appendBit(bit) {
        let newByte = null;
        bitBuffer.push(bit);
        
        if (bit != last_bit) {
            last_bit = bit;
            last_bit_length = 1;
        } else {
            last_bit_length++;
        }
        
        no_state_length++;
        
        if (last_bit_length > 10) { // IDLE state
            idle_val = bit;
            bitBuffer = [];

            if (byteBuffer.length != 0) {
                byteBuffer = [];
            }

            if (last_bit_length > 100 && stackmat_state.on) {
                stackmat_state.on = false;
                handleStateChange();
            } else if (no_state_length > 700) {
                no_state_length = 100;
                handleStateChange();
            }
        } else if (bitBuffer.length == 10) {
            if (bitBuffer[0] == idle_val || bitBuffer[9] != idle_val) {
                bitBuffer = bitBuffer.slice(1);
            } else {
                let val = 0;
                for (let i = 8; i > 0; i--) {
                    val = val << 1 | (bitBuffer[i] == idle_val ? 1 : 0);
                }
                newByte = String.fromCharCode(val);
                byteBuffer.push(newByte);
                decode(byteBuffer);
                bitBuffer = [];
            }
        }
    }

    // Decode byteBuffer into timer state
    function decode(byteBuffer) {
        if (byteBuffer.length != 9 && byteBuffer.length != 10) {
            return;
        }
        
        const re_head = /[ SILRCA]/;
        const re_number = /[0-9]/;
        const head = byteBuffer[0];
        
        if (!re_head.exec(head)) {
            return;
        }
        
        let checksum = 64;
        for (let i = 1; i < byteBuffer.length - 3; i++) {
            if (!re_number.exec(byteBuffer[i])) {
                return;
            }
            checksum += ~~(byteBuffer[i]);
        }
        
        if (checksum != byteBuffer[byteBuffer.length - 3].charCodeAt(0)) {
            return;
        }
        
        const time_milli = ~~byteBuffer[1] * 60000 +
            ~~(byteBuffer[2] + byteBuffer[3]) * 1000 +
            ~~(byteBuffer[4] + byteBuffer[5] + (byteBuffer.length == 10 ? byteBuffer[6] : '0'));
            
        pushNewState(head, time_milli, byteBuffer.length == 9 ? 10 : 1);
    }

    // Update state and trigger callbacks
    function pushNewState(head, time_milli, unit) {
        const new_state = {};
        new_state.time_milli = time_milli;
        new_state.unit = unit;
        new_state.on = true;
        
        const is_time_inc = unit == stackmat_state.unit ?
            new_state.time_milli > stackmat_state.time_milli :
            Math.floor(new_state.time_milli / 10) > Math.floor(stackmat_state.time_milli / 10);
            
        new_state.greenLight = head == 'A';
        new_state.leftHand = head == 'L' || head == 'A' || head == 'C';
        new_state.rightHand = head == 'R' || head == 'A' || head == 'C';
        new_state.running = (head != 'S' || stackmat_state.signalHeader == 'S') &&
            (head == ' ' || is_time_inc);
        new_state.signalHeader = head;
        
        const wasCharging = !stackmat_state.on;
        const wasRunning = stackmat_state.running;
        
        stackmat_state = new_state;
        no_state_length = 0;
        
        handleStateChange(wasCharging, wasRunning);
    }

    // Handle state changes and trigger appropriate callbacks
    function handleStateChange(wasCharging, wasRunning) {
        // Determine what callbacks to trigger
        if (wasCharging && stackmat_state.on) {
            // Timer was just connected/charged
            onChargeCallback(stackmat_state);
        }
        
        if (!wasRunning && stackmat_state.running) {
            // Timer just started
            onStartCallback(stackmat_state);
        }
        
        if (wasRunning && !stackmat_state.running && stackmat_state.on) {
            // Timer just stopped
            onStopCallback(stackmat_state);
        }
    }

    // Public API - dm if you need help using!
    return {
        init: init,
        stop: stop,
        updateInputDevices: updateInputDevices,
        getState: function() {
            return {...stackmat_state};
        }
    };
})();

// Make available globally (thru window obj)
window.stackmat = stackmat;
