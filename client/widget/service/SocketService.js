/**
 * Created by Nicolas on 6/28/15.
 */
import Event from '../events/Event';
import EventEmitter from 'eventemitter3';
import objectAssign from 'object-assign';
import Socket from 'socket';

const CHANNELS = {
    STREAM_UPDATE       : 'plugins.ns-twitch-monitor.streamUpdate',
    STREAMS_WITH_PAYLOAD: 'plugins.ns-twitch-monitor.streamPayloadsGet'
};

export default class SocketService extends EventEmitter {
    constructor() {
        super();
        this.cache = {};
        setTimeout(() => {
            this.updateCache();
            this.subscribe();
        }, 0);
    }

    getCachedStreams() {
        return this.cache;
    }

    subscribe() {
        Socket.on(
            CHANNELS.STREAM_UPDATE,
            (payload) => {
                this.updateItemInCache(payload);
                this.emit(Event.STREAM_DID_UPDATE, payload);
            }
        );
    }

    updateCache() {
        Socket.emit(
            CHANNELS.STREAMS_WITH_PAYLOAD,
            null,
            (error, streamsWithPayload) => {
                if (error) {
                    //Fail silently
                    return console.warn('Error has occurred, can not update initial cache for twitch monitor, error: %s', error.message);
                }
                this.cache = objectAssign({}, this.cache, streamsWithPayload);
                this.emit(Event.STREAM_LIST_DID_UPDATE, this.cache);
            }
        );
    }

    updateItemInCache(streamPayload) {
        if (streamPayload) {
            if (streamPayload.status === 'offline') {
                delete this.cache[streamPayload.channel.name];
            } else {
                this.cache[streamPayload.channel.name] = streamPayload;
            }
        }
    }
}