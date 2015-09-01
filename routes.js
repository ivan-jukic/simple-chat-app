module.exports =
{
      "login"                 : {url: "/", ctl: "Chat", method: "showLoginScreen"},
      "login.do"              : {url: "/login", ctl: "Chat", method: "doUserLogin"},
      "logout.do"             : {url: "/logout", ctl: "Chat", method: "doUserLogout"},
      "chat"                  : {url: "/chat", ctl: "Chat", method: "showChatList"},
      "chat.template"         : {url: "/chat/get-window-html", ctl: "Chat", method: "getWindow"},
      "chat.item"             : {url: "/chat/get-item-html", ctl: "Chat", method: "getChatItem"},
      
      /// Socket events, socket is identifier, second parameter is namespace, omit to use default namespace
      "socket:messages:connection"     : {ctl: "SocketMessages", method: "onNewConnection"},
      "socket:messages:chatMessage"    : {ctl: "SocketMessages", method: "relayMessage"},
      "socket:messages:disconnect"     : {ctl: "SocketMessages", method: "onDisconnect"}
};