var socket              = io('/messages', {'force new connection': true});
window.activeWindows    = {};
window.activeItemXHR    = {};


$(function() {
    
    socket.on('newMessage', function(data) {
        var chat = getChatWindow(data);
        chat.appendOtherMessage(data);
    });
    
    socket.on('syncMessage', function(data) {
        var chat = getChatWindow(data);
        chat.appendMyMessage(data, true);
    });
    
    socket.on('newUser', function(data) {
        window.activeItemXHR[data.userId] = $.ajax({
            url: "/chat/get-item-html",
            type: "POST",
            data: data,
            success: function(html) {
                
                $(".chat-select-list").append(html);
                
                var $cs = $(".chat-select-div");
                if($cs.hasClass('hidden')) {
                    $(".no-one-online").addClass('hidden');
                    $cs.removeClass('hidden');
                }
                
                window.activeItemXHR[data.userId] = null;
                delete window.activeItemXHR[data.userId];
            }
        })
    });
        
    socket.on('removeUser', function(data) {
        
        if (window.activeItemXHR[data.userId]) {
            
            /// Abort chat item request if the user item html request is in progress.
            window.activeItemXHR[data.userId].abort();
        } else {
            $("#chat-user-" + data.userId).remove();
            
            if (0 === $(".chat-select").length) {
                $(".no-one-online").removeClass('hidden');
                $(".chat-select-div").addClass('hidden');
            }
        }
        
        if (window.activeWindows[data.userId]) {
            window.activeWindows[data.userId].userOffline();
        }
    });

    
    
    /******************************************************************************************************************/    
    
    
    $(".chat-select-div").on('click', ".chat-select", function() {
        getChatWindow({
            userId      : $(this).data("id"),
            firstName   : $(this).data("firstname")
            //lastName    : $(this).data("lastname")
        },
        true);
    });
    
    
    function getChatWindow(data, focus)
    {
        if (!activeWindows[data.userId]) {
            activeWindows[data.userId] = new ChatWindow(socket, data);
            activeWindows[data.userId].show(focus);
            activeWindows[data.userId].onClose(function(removeId) {
                activeWindows[removeId] = false;
            });
        }
        
        return activeWindows[data.userId];
    }
});


/**********************************************************************************************************************/

String.prototype.utf8_encode = function() {    
    var argString = this;

    if (argString === null || typeof argString === 'undefined') {
        return '';
    }

    // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var string = (argString + '');
    var utftext = '',
        start, end, stringl = 0;

    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
        var c1 = string.charCodeAt(n);
        var enc = null;

        if (c1 < 128) {
            end++;
        } else if (c1 > 127 && c1 < 2048) {
            enc = String.fromCharCode(
                (c1 >> 6) | 192, (c1 & 63) | 128
            );
        } else if ((c1 & 0xF800) != 0xD800) {
            enc = String.fromCharCode(
                (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        } else {
            // surrogate pairs
            if ((c1 & 0xFC00) != 0xD800) {
                throw new RangeError('Unmatched trail surrogate at ' + n);
            }
            var c2 = string.charCodeAt(++n);
            if ((c2 & 0xFC00) != 0xDC00) {
                throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
            }
            c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
            enc = String.fromCharCode(
                (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
            );
        }
        if (enc !== null) {
            if (end > start) {
                utftext += string.slice(start, end);
            }
            utftext += enc;
            start = end = n + 1;
        }
    }

    if (end > start) {
        utftext += string.slice(start, stringl);
    }

    return utftext;
};
String.prototype.utf8_decode = function() {
    var str_data = this;
    var tmp_arr = [],
        i = 0,
        c1 = 0,
        seqlen = 0;

    str_data += '';

    while (i < str_data.length) {
        c1 = str_data.charCodeAt(i) & 0xFF;
        seqlen = 0;

        // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
        if (c1 <= 0xBF) {
            c1 = (c1 & 0x7F);
            seqlen = 1;
        } else if (c1 <= 0xDF) {
            c1 = (c1 & 0x1F);
            seqlen = 2;
        } else if (c1 <= 0xEF) {
            c1 = (c1 & 0x0F);
            seqlen = 3;
        } else {
            c1 = (c1 & 0x07);
            seqlen = 4;
        }

        for (var ai = 1; ai < seqlen; ++ai) {
            c1 = ((c1 << 0x06) | (str_data.charCodeAt(ai + i) & 0x3F));
        }

        if (seqlen == 4) {
            c1 -= 0x10000;
            tmp_arr.push(String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF)), String.fromCharCode(0xDC00 | (c1 & 0x3FF)));
        } else {
            tmp_arr.push(String.fromCharCode(c1));
        }

        i += seqlen;
    }

    return tmp_arr.join("");
};