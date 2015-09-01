var ChatWindow = function(socket, userTo)
{
    this.socket             = socket;
    this.userTo             = userTo;
    this.$windowToolbar     = $("#chat-stripe");
    this.$window            = null;
    this.closeCallback      = null;
    this.xhrInProgress      = false;
    this.xhrCallback        = [];
    
    if (!ChatWindow.__initialized)
    {
        ChatWindow.prototype.show = function(focus, cb)
        {
            var self = this;
            
            self.xhrInProgress = true;
            
            /// Get the template...
            $.ajax({
                url     : "/chat/get-window-html",
                success : function(html) {
                    
                    /// Set user to name...
                    html = html.replace("{{NAME}}", self.userTo.firstName);
                    
                    /// Save reference!
                    self.$window = $(html);
                                        
                    /// Append to toolbar.
                    self.$windowToolbar.append(self.$window);
                    
                    /// Initialize events.
                    self.initWindowEvents();
                    
                    if (focus) {
                        self.$window.find(".chat-input").focus();
                    }
                    
                    self.xhrInProgress = false;
                    if (self.xhrCallback.length) {
                        for (var i in self.xhrCallback) {
                            self.xhrCallback[i]();
                        }
                    }
                }
            })
        };
        
        
        ChatWindow.prototype.initWindowEvents = function()
        {
            var self = this;
            
            /// close window
            self.$window.find(".btn-remove-window").on("click", function() {
                self.close();
            });
            
            /// Toggle minimized, maximized
            self.$window.find(".chat-window-header").on("click", function() {
                self.toggleMinimize();
            });

            /// Send message.
            self.$window.find(".chat-input").on("keyup", function(e) {
                if (e.keyCode === 13 && !e.shiftKey) {
                    var message = $(this).val();
                    $(this).val("");
                    self.sendMessage(message);                    
                }
            });
        };


        ChatWindow.prototype.sendMessage = function(message)
        {
            var self = this;

            self.socket.emit('chatMessage', {to: self.userTo.userId, message: message.utf8_encode()});
            
            self.appendMyMessage(message.utf8_encode());
        };
        
        
        ChatWindow.prototype.appendMyMessage = function(msg)
        {
            var self = this, data = {};
                        
            if ('string' === typeof msg) {
                data = {message : msg};
            } else {
                data = msg;
            }
            
            self.__appendMessage('me', data);
        };


        ChatWindow.prototype.appendOtherMessage = function(data)
        {
            var self = this;
            
            self.__appendMessage('other', data)
        };
        
        
        ChatWindow.prototype.__appendMessage = function(user, data) 
        {
            var self = this;

            /// Chat window is not ready...
            if (self.xhrInProgress) {
                self.xhrCallback.push(function() {
                    self.__appendMessage(user, data);
                });

                return;
            }
            
            
            var $messageWrapper = self.$window.find(".chat-window-messages-wrapper"),
                $lastMessage    = self.$window.find(".chat-window-messages > .chat-message:last");            

            if ($lastMessage.hasClass('chat-message-' + user)) {                
                var ts = parseInt($lastMessage.data('ts'));
                if (Date.now() - ts < 120000) {
                    appendJustMessage();
                }
                else {
                    appendFullMessage();
                }
            }
            else {
                appendFullMessage();
            }

            /// Scroll to bottom...
            $messageWrapper.scrollTop($messageWrapper[0].scrollHeight);
            
            
            function appendJustMessage() {
                $lastMessage.append('<span class="chat-message-content">' + data.message.utf8_decode() + '</span>');
            }
            

            function appendFullMessage () {
                
                /// Append the message to our window...
                self.$window.find(".chat-window-messages").append(
                    '<div class="chat-message chat-message-' + user + '" data-ts="' + Date.now() + '">' +
                    '<span class="chat-message-stamp">' + self.getDate() + ' ' + ('me' === user ? 'you' : data.firstName) + ' said:</span>' +
                    '<span class="chat-message-content">' + data.message.utf8_decode() + '</span>' +
                    '</div>'
                );
            }
        };


        ChatWindow.prototype.isMinimized = function() 
        {
            return this.$window.hasClass('minimized');
        };
        
        
        ChatWindow.prototype.toggleMinimize = function()
        {
            var self = this;
            
            /// Check if window is minimized
            if (self.$window.hasClass('minimized')) {
                self.$window.removeClass('minimized');
            } else {
                self.$window.addClass('minimized');
            }
        };
        
        
        ChatWindow.prototype.userOffline = function()
        {
            var self = this;

            if (self.$window.hasClass("offline")) {
                return;
            }
            
            self.$window
                .addClass("offline")
                .find(".chat-window-messages")
                .append("<div class='chat-message-user-offline'>User went offline!</div>");

            self.$window
                .find(".chat-input")
                .attr("disabled", "disabled");
        };
        
        
        ChatWindow.prototype.close = function()
        {
            var self = this;
            
            /// Remove window
            self.$window.remove();

            if ('function' === typeof self.closeCallback) {
                self.closeCallback(self.userTo.userId);
            }
        };
        
        
        ChatWindow.prototype.onClose = function(fn) 
        {
            if ('function' === typeof fn) {
                this.closeCallback = fn;
            }
        };
        
        
        ChatWindow.prototype.getDate = function() 
        {
            var date    = new Date(),
                dd      = __precedingZero(date.getDate()),
                mm      = __precedingZero(date.getMonth() + 1),
                yyyy    = date.getFullYear(),
                H       = __precedingZero(date.getHours()),
                i       = __precedingZero(date.getMinutes()),
                s       = __precedingZero(date.getSeconds());

            return dd + "/" + mm + "/" + yyyy + " " + H + ":" + i + ":" + s;

            function __precedingZero(val) {
                return val < 10 ? '0' + val : val;
            }
        };
        
      
        ChatWindow.__initialized = true;
    }
};