module.exports = UserSocketRedis = function() {
    this.redisKeyPrefix = 'userSocketRegistry:';
    this.registryCacheDuration = 7 * 86400;    /// 7 days for an individual user.
};

/**
 * Add new user socketId to his registry in redis.
 * @param userId
 * @param socketId
 * @returns {*}
 */
UserSocketRedis.prototype.addNewUserSocket = function(userId, socketId) {
    var self = this;
    var q = require('q');
    var deferred = q.defer();

    self
        .__getUserSockets(userId)
        .then(function(response) {
            var data = response.data;
            var sockets = response.sockets;

            /// Push the socket in the registry of that user.
            data.push({ socketId : socketId, date : Date.now() });
            sockets.push(socketId);

            /// Save socket user registry
            self.__setUserSockets(userId, data)
                .then(function() {
                    deferred.resolve(sockets);
                }, function(err) {
                    deferred.reject(err);
                });
        }, function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};


/**
 * Get user sockets from redis.
 * @param userId
 */
UserSocketRedis.prototype.getUserSockets = function(userId) {
    var self = this;
    var q = require('q');
    var deferred = q.defer();

    self.__getUserSockets(userId)
        .then(function(response) {
            deferred.resolve(response.sockets);
        }, function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};


/**
 * Remove user socketId from his registry on disconnect.
 * @param userId
 * @param socketId
 * @returns {*}
 */
UserSocketRedis.prototype.removeUserSocket = function(userId, socketId) {
    var self = this;
    var q = require('q');
    var deferred = q.defer();

    self.__getUserSockets(userId)
        .then(function(response) {
            var i;
            var data = response.data;
            var sockets = response.sockets;
            /// Remove disconnecting socket...
            for (i = 0; i < data.length; i++) {
                if (data[i].socketId === socketId) {
                    data.splice(i, 1);
                    sockets.splice(i, 1);
                    i--;
                }
            }

            /// Save socket user registry
            self.__setUserSockets(userId, data)
                .then(function() {
                    deferred.resolve(sockets);
                }, function(err) {
                    deferred.reject(err);
                });
        }, function(err) {
            deferred.reject(err);
        });

    return deferred.promise;
};


/**
 * Get user sockets from redis
 * @param userId
 * @returns {*}
 * @private
 */
UserSocketRedis.prototype.__getUserSockets = function(userId) {
    return this.__getSetData('get', userId);
};


/**
 * Set user socket ids in redis
 * @param userId
 * @param data
 * @returns {*}
 * @private
 */
UserSocketRedis.prototype.__setUserSockets = function(userId, data) {
    return this.__getSetData('set', userId, data);
};


/**
 * Generic handler to set socket data.
 * @param action
 * @param userId
 * @param data
 * @returns {*}
 * @private
 */
UserSocketRedis.prototype.__getSetData = function(action, userId, data) {
    var self = this;
    var q = require('q');
    var deferred = q.defer();
    var Jet = this.Jet;

    if (!Jet.redis) {
        deferred.reject("SetUserSocketRedisData :: Redis object not available");
    } else {
        if ('set' === action) {
            /// Save data to socket user registry
            Jet.redis.set(self.__getRedisKey(userId), JSON.stringify(data), 'EX', self.registryCacheDuration, function(err, reply) {
                if (!err) {
                    deferred.resolve();
                } else {
                    deferred.reject(err);
                }
            });
        } else if ('get' === action) {
            /// Get data from user socket registry
            Jet.redis.get(self.__getRedisKey(userId), function(err, data) {
                if (!err) {
                    data = JSON.parse(data);
                    var i, sockets = [];
                    if (null === data || !Array.isArray(data)) {
                        data = [];
                    }
                    /// Remove old sockets...
                    data = self.__cleanSocketData(data);
                    /// Get all active sockets for this user in separate array.
                    for (i in data) {
                        sockets.push(data[i].socketId);
                    }

                    deferred.resolve({data: data, sockets: sockets});
                } else {
                    deferred.reject(err);
                }
            });
        } else {
            deferred.reject("USerSocketRedis.__getSetData :: Unknown action " + action);
        }
    }

    return deferred.promise;
};


/**
 *
 * @param userId
 * @returns {string}
 * @private
 */
UserSocketRedis.prototype.__getRedisKey = function(userId) {
    return this.redisKeyPrefix + userId;
};


/**
 *
 * @param data
 * @returns {*}
 * @private
 */
UserSocketRedis.prototype.__cleanSocketData = function(data) {
    var i, daysInCache, msInDay = 86400000, currentUTC = Date.now();
    /// Remove old socket references.
    for (i = 0; i < data.length; i++) {
        /// Calculate the number of days socket id has been in the cache
        daysInCache = (currentUTC - data[i].date) / msInDay;

        if (1 / 24 <= daysInCache) {
            data.splice(i, 1);
            i--;
        }
    }
    return data;
};