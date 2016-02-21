/*
* SimpleModal Basic Modal Dialog
* http://www.ericmmartin.com/projects/simplemodal/
* http://code.google.com/p/simplemodal/
*
* Copyright (c) 2010 Eric Martin - http://ericmmartin.com
*
* Licensed under the MIT license:
*   http://www.opensource.org/licenses/mit-license.php
*
* Revision: $Id: basic.js 254 2010-07-23 05:14:44Z emartin24 $
*/

jQuery(function ($) {
    // Load dialog on page load
    //$('#basic-modal-content').modal();

    // Load dialog on click
    $('#basic-modal_img .basic, #basic-modal_title .basic').click(function (e) {
        $('#basic-modal-content').modal({
            onOpen: function (dialog) {
                if ( $.browser.msie ) {
                    dialog.overlay.fadeIn('slow', function () {
                        $('#simplemodal-overlay').css({'filter' : 'alpha(opacity=65)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=65)'}) is used to fix the IE Bug on fading transparencies
                        dialog.container.show();
                        dialog.data.show();
                    });
                } else {
                    dialog.overlay.fadeIn('slow', function () {
                        $('#simplemodal-overlay').css({'filter' : 'alpha(opacity=65)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=65)'}) is used to fix the IE Bug on fading transparencies
                        dialog.container.fadeIn();
                        dialog.data.show();
                    });
                }
            }
        });
        return false;
    });
});

jQuery(function ($) {
    // Load dialog on page load
    //$('#basic-modal-content').modal();

    // Load dialog on click
    $('#basic-modal2_img .basic2, #basic-modal2_title .basic2').click(function (e) {
        $('#basic-modal-content2').modal({
            onOpen: function (dialog) {
                if ( $.browser.msie ) {
                    dialog.overlay.fadeIn('slow', function () {
                        $('#simplemodal-overlay').css({'filter' : 'alpha(opacity=65)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=65)'}) is used to fix the IE Bug on fading transparencies
                        dialog.container.show();
                        dialog.data.show();
                    });
                } else {
                    dialog.overlay.fadeIn('slow', function () {
                        $('#simplemodal-overlay').css({'filter' : 'alpha(opacity=65)'}).fadeIn(); //Fade in the fade layer - .css({'filter' : 'alpha(opacity=65)'}) is used to fix the IE Bug on fading transparencies
                        dialog.container.fadeIn();
                        dialog.data.show();
                    });
                }
            }
        });
        return false;
    });
});

/**
 * Converts form data to JSON object. Usage: $('#form_id').serializeObject()
 */
$.fn.serializeObject = function()
{
    var o = {};
    var a = this.serializeArray();
    $.each(a, function() {
        if (o[this.name]) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(this.value || '');
        } else {
            o[this.name] = this.value || '';
        }
    });
    return o;
};