module.exports = UserSendMessage = function() { };

UserSendMessage.prototype.relayMessage = function(user, socketId, namespace, data) {
    var q = require('q');
    var deferred = q.defer();
    var Jet = this.Jet;
    var connected = Jet.io.of(namespace).connected;
    var error = false;
    var userToSuccess = false;
    var userFromSuccess = false;

    Jet.service
        .get('UserSocketRedis')
        .getUserSockets(data.to)
        .then(function(sockets) {
            if(sockets.length) {
                for (var i in sockets) {
                    if (connected[ sockets[i] ]) {
                        connected[ sockets[i] ]
                            .emit('newMessage', {
                                userId      : user.userId,
                                firstName   : user.firstName,
                                lastName    : user.lastName,
                                message     : data.message
                            });
                    }
                }
            }
            userToSuccess = true;
            __finishRelay();
        }, function(err) {
            if (!error) {
                error = true;
                deferred.reject(err);
            }
        });

    Jet.service
        .get('UserSocketRedis')
        .getUserSockets(user.userId)
        .then(function(sockets) {
            for (var i in sockets) {
                /// Socket must be available and not the same one from which we received the message!
                if (connected[ sockets[i] ] && socketId !== sockets[i]) {
                    connected[ sockets[i]]
                        .emit('syncMessage', {userId: data.to, message: data.message});
                }
            }
            userFromSuccess = true;
            __finishRelay();
        }, function(err) {
            if (!error) {
                error = true;
                deferred.reject(err);
            }
        });

    function __finishRelay() {
        if (userFromSuccess && userToSuccess) {
            deferred.resolve();
        }
    }

    return deferred.promise;
};