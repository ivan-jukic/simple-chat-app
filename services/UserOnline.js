module.exports = UserOnline = function() { };

/**
 * Add a user to online users list.
 * @param user
 * @returns {*}
 */
UserOnline.prototype.addUserToOnlineList = function(user) {
    var q = require('q');
    var deferred = q.defer();
    var Jet = this.Jet;

    if (user) {
        /// Push user data to redis list...
        Jet.redis.rpush(Jet.app.get('redisList'), JSON.stringify(user), function(err, reply) {
            if (!err) {
                /// Publish redis event
                Jet.service.get('RedisChannel').emit('userLogin', user);
                Jet.io.of(Jet.app.get('socketMessagesNamespace')).emit('newUser', user);
                deferred.resolve();
            } else {
                Jet.log(err);
                deferred.reject(err);
            }
        });
    } else {
        deferred.reject({message: 'user not available'});
    }

    return deferred.promise;
};


/**
 * Load the whole list of online users for our app.
 * @param user
 */
UserOnline.prototype.getOnlineUserList = function(user) {
    var q = require('q');
    var deferred = q.defer();
    var Jet = this.Jet;

    Jet.redis.lrange(Jet.app.get('redisList'), 0, -1, function(err, data) {
        if (err) {
            Jet.log(err);
            deferred.reject(err);
        } else {
            var users = [];
            for (var i in data) {
                /// Parse data...
                data[i] = JSON.parse(data[i]);
                /// If this is the current user, do not add himself to the list...
                if (data[i].userId === user.userId) {
                    continue;
                }
                users.push(data[i]); /// Push data to the list...
            }
            /// Success...
            deferred.resolve(users);
        }
    });

    return deferred.promise;
};


/**
 * Method which will add a user to the online user list in redis.
 * @param user
 */
UserOnline.prototype.removeUserFromOnlineList = function(user) {
    var q = require('q');
    var defered = q.defer();
    var Jet = this.Jet;

    if (user) {
        Jet.redis.lrem(Jet.app.get('redisList'), 1, JSON.stringify(user), function(err) {
            if (!err) {
                /// Publish redis event
                Jet.service.get('RedisChannel').emit('userLogout', user);
                Jet.io.of(Jet.app.get('socketMessagesNamespace')).emit('removeUser', user);
                defered.resolve(user);
            } else {
                /// Echo error if it occurred
                Jet.log(err);
                defered.reject(err);
            }
        });
    } else {
        defered.reject({message: 'user not available'});
    }

    return defered.promise;
};