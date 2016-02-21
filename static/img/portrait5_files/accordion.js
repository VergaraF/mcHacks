//
// SIDEBAR ACCORDIONS BORDER
//

$(document).ready(function() {
    $(document.body).on('click', 'a.collapse_handle', function(e) {
        e.preventDefault();
        var $gadget = $(this).parents('div.gadget'),
            $content = $gadget.find('.content');

        if($content.is(':hidden')) {
            $gadget.removeClass('collapsed');
            $content.slideDown('fast', function() {
                //load collapsed gadget when page was initialised
                var ind = $gadget.attr('data-gadget_index');
                //console.log(ind);
                if(ind){
                    gadgetLoader.loadSingle(APPINIT.gadgets[ind].url, APPINIT.gadgets[ind].data);
                    $gadget.removeAttr('data-gadget_index');
                }
                saveGadgetState();
            });
        }
        else {
            $content.slideUp('fast', function() {
                $gadget.addClass('collapsed');
                saveGadgetState();
            });
        }
    });
});