module.exports = RedisChannel = function() { };

/**
 * Register event handlers for messages coming through the redis channel.
 * One process receives the message, then it has to tell to the others
 * that new message arrived, and then it broadcasts it. Other processes
 * then receive a new message and check if they have any connections
 * opened from the user who is supposed to receive the message.
 * @returns {*|promise}
 */
RedisChannel.prototype.registerEventHandlers = function() {
    /// Open new redis connection, used for subscription...
    var self = this;
    var q = require('q');
    var deferred = q.defer();
    var Jet = this.Jet;
    var redisConfig = Jet.app.get('redisOptions');
    var redisSub = require('redis').createClient(redisConfig.port, redisConfig.host, redisConfig.options);

    redisSub
        .on('error', function(err) {
            Jet.log(err);
            deferred.reject(err);
        })
        .on('connect', function() {
            /// Subscribe to redis events...
            redisSub.subscribe(Jet.app.get('redisChannel'));
            /// Await messages...
            redisSub.on('message', function(channel, message) {
                /// Parse the message...
                var e = JSON.parse(message);

                /**
                 * Even if this instance of messaging app had sent the message in the redis channel, it
                 * will still raise the event and try to handle it, that's why we handle it this way.
                 * First check if this instance was the one responsible to relay the message, if no
                 * then relay it to its destination.
                 */

                if (!Jet.io || Jet.instance.id === e.instanceId) {
                    return;
                }

                self.routeEvents(e);
            });

            deferred.resolve();
        });

    return deferred.promise;
};


/**
 * Handle messages relayed through the redis channel...
 * @param e
 */
RedisChannel.prototype.routeEvents = function(e) {
    var self = this;
    if ('userLogin' === e.event) {
        self.handleUserLogin(e.data);
    } else if ('userLogout' === e.event) {
        self.handleUserLogout(e.data);
    } else if ('relayMessage' === e.event) {
        self.handleRelayMessage(e.data);
    }
};


RedisChannel.prototype.handleUserLogin = function(data) {
    this.Jet.io.of(this.Jet.app.get('socketMessagesNamespace')).emit('newUser', data);
};


RedisChannel.prototype.handleUserLogout = function(data) {
    this.Jet.io.of(this.Jet.app.get('socketMessagesNamespace')).emit('removeUser', data);
};


RedisChannel.prototype.handleRelayMessage = function(data) {
    this.Jet.service.get("UserSendMessage").relayMessage(data.from, null, data.namespace, data.data);
};


RedisChannel.prototype.emit = function(event, data) {
    /// Publish redis event
    this.Jet.redis
        .publish(
            this.Jet.app.get('redisChannel'),
            JSON.stringify({
                event: event,
                instanceId: this.Jet.instance.id,
                data: data
            })
    );
};