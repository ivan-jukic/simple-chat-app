# SIMPLE CHAT APP

This is an example of a simple chat app, built on top of Redis and [jet-framework](https://github.com/ivan-jukic/jet-framework).

It is possible to start multiple instances of the app, they will subscribe to the same Redis channel, and notify
each other about new events (new messages, users, etc.).

Each user is assigned a temporary id, and all of his socket connection id's are stored in Redis. When the user has to be
notified about an event, his socket id's are loaded from the Redis, and event is emitted to all of his active connections.
This happens in all instances, as the user may be connected to more than one (user has opened multiple browser windows).

A live example is available [here](http://ivanjukic.com/).

*This app was not meant to be used for any production environments, as there are still bugs and it has not been tested
properly.*

TODO:

* Fix bugs
* Add tests
* Use angular.js for frontend
* Optimize for mobile
