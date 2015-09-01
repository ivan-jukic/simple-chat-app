module.exports = Chat = function() {
    this.avatars = ['508076', '441770', '905111', '577376', '120517', '781223'];
    this.avatarUrlTemplate = "http://www.picgifs.com/clip-art/cartoons/pokemon/clip-art-pokemon-{{ID}}.jpg";
};

/**
 * Displays login screen for the users!
 */
Chat.prototype.showLoginScreen = function() {
    var self = this;
    if (this.getSession('user')) {
        this.redirect(this.Jet.routes.get('chat'), 302);
    } else {
        this.addPageValue('avatars', self.avatars);
        this.addPageValue('urlTemplate', self.avatarUrlTemplate);
        this.setTemplate('login');
        this.send();
    }
};

/**
 * Displays a list of all users that are online.
 */
Chat.prototype.showChatList = function() {
    var self = this;
    var user = self.getSession('user');
    if (!user) {
        self.redirect(this.Jet.routes.get('login'));
    } else {
        this.Jet.service.get('UserOnline')
            .getOnlineUserList(user)
            .then(function(users) {
                self.addOuterPageValue('user', user);
                self.addPageValue('user', user);
                self.addPageValue('userList', users);
                self.addPageValue('urlTemplate', self.avatarUrlTemplate);
                self.setTemplate('chat');
                self.send();
            }, function(err) {
                self.send(err);
            });
    }
};

/**
 * Dummy user login. Creates user session.
 */
Chat.prototype.doUserLogin = function() {
    var user = this.req.body['chat-name'];
    var avatar = this.req.body['chat-avatar'];
    if (user && avatar) {
        var userId = this.Jet.utils.sha1(Date.now() + user).substr(0, 10);
        var sessionData = {userId: userId, avatar: avatar, firstName: user, lastName: ""};
    }

    /// Add user to online list...
    this.Jet.service.get('UserOnline').addUserToOnlineList(sessionData);

    /// Set session data...
    this.setSession('user', sessionData);

    /// Redirect to homepage...
    this.redirect(this.Jet.routes.get('chat'), 302);
};

/**
 * Logout user.
 */
Chat.prototype.doUserLogout = function() {
    var user = this.getSession('user');

    this.req.session.destroy();
    this.redirect(this.Jet.routes.get('login'));

    /// Remove from user redis list...
    this.Jet.service.get('UserOnline').removeUserFromOnlineList(user);
};

/**
 * Compile and send user chat window.
 */
Chat.prototype.getWindow = function(){
    this.setTemplate("chatWindow");
    this.sendInnerHtml();
};

/**
 * Get chat person data...
 */
Chat.prototype.getChatItem = function() {
    var data = {
        userId: this.req.body['userId'],
        firstName: this.req.body['firstName'],
        avatar: this.req.body['avatar']
    };

    this.addPageValue('user', data);
    this.addPageValue('urlTemplate', this.avatarUrlTemplate);
    this.setTemplate("chat.item");
    this.sendInnerHtml();
};