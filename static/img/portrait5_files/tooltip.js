/**
* Just a simple AWESOME tooltip
* @author Slavic Dragovtev [slavic@madhazelnut.com]
*/
function Tooltip(e,html,options){
    var defaults = {
        maxwidth: 160,
        width: '',
        purgatory: 300, // milliseconds one has to get to the choppa' before the tooltip disappears
        top_offset: 29,
        left_offset: 0,
        arrow: false
    }
    var trigger = e
    $.extend(defaults,options, $(e).data())
    $('#tooltip').remove()  // any existing..
    var ttThis = this,
    offset = $(trigger).offset();
    if(offset == null) return false; //page not fully loaded, return false
    // Append the tooltip
    $('body').append('<div id="tooltip" class="tooltip">' + html + '</div>');
    var tt = $('#tooltip')
    tt.css('max-width',defaults.maxwidth +'px').css('position','absolute')
        .css('width', defaults.width + 'px')
    // Set the coordinates of the tooltip
    var top = offset.top + defaults.top_offset,
    left = offset.left + defaults.left_offset + $(trigger).width()/2 - tt.width()/2;
    scrollpoint_x = $(window).width() + $(window).scrollLeft();
    //fix tooltip overlapping outside the page on the right side
    if(left+tt.width() > scrollpoint_x) left = scrollpoint_x - tt.width();
    //fix tooltip overlapping outside the page on the left side
    if(left < $(window).scrollLeft()) left = $(window).scrollLeft();

    tt.css('top', top);
    tt.css('left', left);

    //Tooltip arrow
    if(defaults.arrow) {
        var pos = defaults.arrow.split('-');
        if(pos[0]=='top'||pos[0]=='bottom')var adjust_pos = 'left';
        else var adjust_pos = 'top';
        var adjust = (pos[1]) ? pos[1] :
            adjust_pos == 'left' ? $('#tooltip').width()/2 - 10 : ($('#tooltip').height()+9)/2-10;
        var style = ' style="'+adjust_pos+':'+parseInt(adjust)+'px"';
        var arrow = '<div class="arrow '+pos[0]+'"'+style+'></div>';
        $('#tooltip').append(arrow);
    }

    // Set the z-index so it's pretty much the upper most layer
    tt.css('z-index',10000)
    $(trigger).mouseleave(function(){
        window.setTimeout(function(){
            if(!ttThis.isHovered || defaults.purgatory == 0){
                if (defaults.deleteCallback){
                    defaults.deleteCallback(ttThis,tt)
                }
                $(tt).remove()
            }
        },defaults.purgatory)
    })
    $(tt).hover(
        function(){
            ttThis.isHovered = true;
        },
        function(){
            if (defaults.deleteCallback ){
                defaults.deleteCallback(this,tt)
            }
            $(this).remove()
        }
    )
}