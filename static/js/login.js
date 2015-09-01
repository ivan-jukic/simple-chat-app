$(function() {
    
     $(".btn-login").on('click', function() {
         var name   = $(".chat-name-input").val(),
             avatar = $(".img-thumb.selected").data("avatar");
         
         if (!name) {
             alert("Please enter your name!");
         }
         else if (!avatar) {
             alert("Please select your avatar!");
         }
         else {
             $("body")
                 .append(
                    "<form id='login-form' action='/login' method='post'>" +
                        "<input type='hidden' name='chat-name' value='" + name + "' />" +
                        "<input type='hidden' name='chat-avatar' value='" + avatar + "' />" +
                    "</form>")
                 .find("#login-form")
                 .submit();
         }
     });
    
    
    $(".img-thumb").on('click', function() {
        $(".img-thumb.selected").removeClass('selected');
        $(this).addClass('selected');
    });
});
