/**
* Plugin for easily pragrammatical checkboxes selecting after applying
* formreplacer plugin for them
*
* Arguments to supply:
* checked: true to check the checkbox, false to uncheck it
*
*/
(function(a) {
    a.fn.checkBoxer = function(options) {
        this.each(function() {
            var input = $(this).find('.replacer_checkbox')
            var box = $(this).find('.fReplacedCheckbox')
            if (input.length == 0 || box.length == 0) return
            if (options['checked']) {
                box.addClass('selected')
                input.attr('checked', true)
            }
            else {
                box.removeClass('selected')
                input.attr('checked', false)
            }
        });
    };
})(jQuery);