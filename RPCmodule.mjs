import { readFileSync } from 'fs';
import { createConnection } from 'net';    
export default class jamulusRpcInterface {
    #authenticated
    #RPCPORT;
    #RPCHOST;
    #SECRET;
    constructor(RPCPORT, SECRET_file) {
        this.#authenticated = false;
        this.#RPCPORT = RPCPORT;
        this.#RPCHOST = '127.0.0.1';
        this.AvailableMethods = [
            'jamulus/getMode',
            'jamulus/getVersion',
            'jamulusserver/broadcastChatMessage',
            'jamulusserver/privateChatMessage',
            'jamulusserver/getClients',
            'jamulusserver/getRecorderStatus',
            'jamulusserver/getServerProfile',
            'jamulusserver/getStreamStatus',
            'jamulusserver/restartRecording',
            'jamulusserver/setDirectory',
            'jamulusserver/setRecordingDirectory',
            'jamulusserver/setServerName',
            'jamulusserver/setStreamDestination',
            'jamulusserver/setWelcomeMessage',
            'jamulusserver/startRecording',
            'jamulusserver/startStream',
            'jamulusserver/stopRecording',
            'jamulusserver/stopStream',
            'jamulusserver/toggleStream'
        ]
        
        this.#SECRET = readFileSync(SECRET_file, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
        }).slice(0, -1);
        this.jamRPCServer = createConnection(
            this.#RPCPORT, this.#RPCHOST,
            () => {
                console.log('connected to server!');
                const reqAuth=`{"id":"Auth","jsonrpc":"2.0","method":"jamulus/apiAuth","params":{"secret": "${this.#SECRET}"}}\n`;
                this.jamRPCServer.write(reqAuth);
                this.jamRPCServer.once('data', (data) => {
                    data = data.toString().split('\n');
                    data.forEach( (row) => {
                        if (row) row = JSON.parse(row);
                        if (row.length != 0 && row.result == 'ok' && row.id == 'Auth') {
                            console.log('Authentication successful! Received result: ' + row.result);
                            this.#authenticated = true;
                            this.jamRPCServer.write(`{"id":"Mode","jsonrpc":"2.0","method":"jamulus/getMode","params":{}}\n`);
                            this.jamRPCServer.write(`{"id":"Version","jsonrpc":"2.0","method":"jamulus/getVersion","params":{}}\n`);
                            this.jamRPCServer.once('data', (data) => {
                                data = data.toString().split('\n');
                                data.forEach( (row) => {
                                    if (row) {
                                        row = JSON.parse(row);
                                    } else { return; };
                                    if (row.length != 0) {
                                        switch (row.id) {
                                            case 'Version':
                                                this.version = row.result.version;
                                                console.log('Version: ' + this.version);
                                                break;
                                            case 'Mode':
                                                this.mode = row.result.mode;
                                                console.log('Mode: ' + this.mode);
                                                break;
                                            default:
                                                break;
                                        }
                                    }
                                });
                            });
                        }
                    });
                });
            }
        );
    }
};
