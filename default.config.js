module.exports = {
    'socketMessagesNamespace'   : 'messages',
    'redisChannel'              : 'messagingChannel',
    'redisList'                 : 'onlineUsersList',
    'serveStatic'               : true,
    'useSession'                : true,
    'useRedis'                  : true,
    'useRedisSession'           : true,
    'redisOptions'              : {
        'port'      : 6379,
        'host'      : '127.0.0.1',
        'options'   : {}
    },
    'useWebSockets'             : true,
    'useMorganLogging'          : true,
    'useConsoleLogging'         : true
};