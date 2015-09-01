module.exports = SocketMessages = function() {};

/**
 * This function is executed when new socket
 * connection is established.
 */
SocketMessages.prototype.onNewConnection = function() {
    var self = this;
    var user = self.getSession('user');
    var socketId = self.req.getSocketID();
    var namespace = self.req.getEventNamespace();

    if (!user) {
        return;
    }

    this.Jet.service
        .get('UserSocketRedis')
        .addNewUserSocket(user.userId, socketId)
        .then(function(sockets) {
            self.Jet.log("User: " + user.userId + " / Socket connected: " + socketId + " / Namespace: " + namespace);
        }, function(err) {
            self.res.send(err);
        });
};


/**
 * Method which receives socket request to send the
 * message. The message is then passed to the service
 * UserSendMessage which relays that message to all
 * of the socket connections of our "to" user,
 * synchronizes with all sockets from our "from" user,
 * and publishes this event to redis channel.
 */
SocketMessages.prototype.relayMessage = function() {
    var self = this;
    var user = self.getSession('user');
    var socketId = self.req.getSocketID();
    var namespace = self.req.getEventNamespace();
    var data = {
        to: self.req.body["to"],
        message: self.req.body["message"]
    };

    if (!user) {
        return;
    }

    /// Pass this message to the service which will handle
    /// the relaying of this message to the right endpoints.
    this.Jet.service
        .get("UserSendMessage")
        .relayMessage(user, socketId, namespace, data)
        .then(function() {

        }, function(err) {
            self.res.send(err);
        });

    /// Emit this event to the redis channel for other instances.
    this.Jet.service
        .get('RedisChannel')
        .emit('relayMessage', {
            from: user,
            namespace: namespace,
            data: data
        });
};


/**
 * When user closes his connection with the server
 * we detect socket disconnect (on the next socket
 * heartbeat) and do the required cleanup work.
 */
SocketMessages.prototype.onDisconnect = function() {
    var self = this;
    var user = self.getSession('user');
    var socketId = self.req.getSocketID();

    if (!user) {
        return;
    }

    this.Jet.service
        .get('UserSocketRedis')
        .removeUserSocket(user.userId, socketId)
        .then(function(sockets) {
            self.Jet.log("User " + user.userId + ", Socket disconnected: " + socketId);

            /// User has no more opened connections...
            if (0 === sockets.length) {

                /// Broadcast to all user has left the chat
                self.Jet.io.sockets.emit('removeUser', user);

                /// Remove the user from list of online users...
                self.Jet.redis.lrem(self.Jet.app.get('redisList'), 1, JSON.stringify(user));
            }
        });
};