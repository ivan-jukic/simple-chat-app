var Jet = require('jet-framework')();

/**
 * Example of how to handle some more
 * specific stuff with jet-framework.
 */
Jet.addEventListener('onServerStart', function() {
    var uuid = require('node-uuid');

    /// Identification for this instance of the chat app...
    Jet.instance = {
        id : uuid.v4()
    };

    /// Register Redis channel to relay messages!
    Jet.service.get('RedisChannel').registerEventHandlers();

    /// Handle interruptions...
    process.on('SIGINT', function() {
        processQuit();
    }).on('SIGHUP', function() {
        processQuit();
    });

    function processQuit() {
        /// TODO handle socket connections, graceful exit, remove them from the registry
        /// Exit now...
        process.exit(0);
    }
});