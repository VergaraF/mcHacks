$(document).ready(function() {
    Suggestion.init()
});

var Suggestion = {
    $container: null,
    $search_field: null,
    $sections: null,
    search_type: 2,
    is_active: true,
    search_timeout: false,
    CDN_URLS: [
        'http://d2md970h2x6jr4.cloudfront.net/',
        'http://d1gtgfp97cv0rr.cloudfront.net/',
        'http://d38szdgzayr2f0.cloudfront.net/',
        'http://d25pyass8iyz1s.cloudfront.net/'
    ],
    init: function () {
        this.$container = $('#as_search')
        this.$search_field = $('.search input[name="search"]')
        this.$sections = $('.as_search_section')
        this.$search_field.keyup(this.keyup)
            .keydown(this.keydown)
            .focus(this.focusSearch)
            .blur(this.blurSearch)
            .click(this.clickSearch)
        this.$container.find('a')
            .mouseenter(this.overLink)
            .mouseleave(this.outLink)
            .click(this.clickRow)
        $('#search_form_button').mousedown(function(e) {
            e.preventDefault()
            Suggestion.searchSubmit()
        })
    },
    keyup: function(e) {
        if ((e.keyCode < 48 || e.keyCode > 90) && e.keyCode != 8 && e.keyCode != 32) return true;
        Suggestion.$container.find('a.selected').removeClass('selected')
        Suggestion.get()
    },
    get: function() {
        var data = {};
        data.prefix = this.$search_field.val()
        $('.search .suggest_label').html('');
        if (data.prefix == '') {
            this.$container.hide()
            return
        }
        else if (this.$container.is(':hidden')) this.$container.show();

        //Ensure first character is capital and not space.
        if (data.prefix == ' ') this.$search_field.val('');

        data.search_type = this.search_type
        var callback  = function(resp) {
            if (resp.status != 0) return;

            if (resp.sections[0].items[0])
                $('.search .suggest_label').html(resp.sections[0].items[0].label);

            for (var i = 0; i < 3; i++)
                Suggestion.renderSection(i, resp.sections[i])
            //to prevent not hidden suggestion box in case internet connection is slow
            if (Suggestion.is_active)
                Suggestion.$container.show()
        }
        $.getJSON('/search/get_suggestions', data, callback);
    },
    renderSection: function(section_index, data) {
        var $section = $(this.$sections[section_index])
        if (section_index == 0 && !data.items.length) {
            $section.hide()
            return
        }
        else $section.show()

        $section.find('.search_area').html(data.name)
        $section.find('a').each(function(row_index, el) {
            var $row = $(el)
            var $label = $row.find('.suggestion_title')
            //first row is a value from the search field
            if (section_index != 0 && row_index == 0) {
                var keywords = $.trim(Suggestion.$search_field.val().toLowerCase())
                var upper = keywords.charAt(0).toUpperCase() + keywords.slice(1)
                $label.html(upper)
                var search_url = Suggestion.getSearchController(data.type)
                $row.attr('href', '/' + search_url + '#' + keywords.split(' ').join('-'))
                var icon = '/images/search/' + ((data.name == 'Shoots') ? 'shoot' : 'model') + '_dropdown.png'
                $row.find('img').attr('src', icon)
                $row.find('.suggestion_description').html('Multiple results')
                return;
            }

            var new_index = (section_index != 0) ? (row_index - 1) : row_index
            if (typeof data.items[new_index] == 'undefined') $row.hide()
            else {
                var item = data.items[new_index]
                $row.attr('href', item.link)
                $row.find('img').attr('src', Suggestion.CDN_URLS[item.cdn_id] + item.preview + '-box_49_49.jpg')
                $row.find('.suggestion_title').html(item.label)
                var results = item.results + ' ' + Suggestion.getLabel()
                if (item.results != 1) results += 's'
                $row.find('.suggestion_description').html(results)
                $row.show()
            }
        });
    },
    getLabel: function() {
        switch (this.search_type) {
            case 2:
                return 'Image';
            case 0:
                return 'Shoot';
            case 1:
                return 'Model';
        }
    },
    getSearchController: function(type) {
        switch (type) {
            case 0:
                return 'shoots';
            case 1:
                return 'models';
            default:
                return 'search';
        }
    },
    searchSubmit: function() {
        var href, search_url, $selected = Suggestion.$container.find('a.selected'),
            val = $.trim(this.$search_field.val());
        //prevents empty searches
        if(val == '') return false;
        if (!$selected.length) {
            search_url = Suggestion.getSearchController(Suggestion.search_type)
            var hash = val.toLowerCase().replace(/[_|\s\/]+/g, '-')
            href = '/' + search_url + '#' + hash
        }
        else href = $selected.attr('href')
        Suggestion.startSearch(href)
    },
    startSearch: function(href) {
        //reset search conditions for evert new search
        if (typeof Search === 'object') {
            Search.resetNewSearch()
            //include locked items in the url
            var val = $.trim(this.$search_field.val());
            val = val.replace(/-/g, '\\-'); //preserve - sign for exclude keyword
            var obj = $.extend(true, {}, Search.locks);
                val_array = val.split(' ');
            if(typeof obj.search !== 'undefined' || $.trim(obj.search) != '') {
                var search_arr = obj.search.split(' ');
                for(i in search_arr) if($.inArray(search_arr[i],val_array) == -1) val_array.unshift(search_arr[i]);
            }
            obj.search = val_array.join(' ');
            href = href.substr(0, href.lastIndexOf('#'));
            href += '#'+myApp.objToBeautifulUrl(obj);
        }
        //clears the search box after 20 seconds.
        this.$search_field.val(this.$search_field.val() + ' ').blur();
        if(this.search_timeout) clearTimeout(this.search_timeout);
        this.search_timeout = setTimeout(function(){
            Suggestion.$search_field.val('').blur();
            Suggestion.search_timeout = false;
        }, 20000);
        location.href = href
    },
    clickRow: function(e) {
        e.preventDefault()
        $('#main_search_top').val($(this).find('.suggestion_title').html())
        Suggestion.startSearch($(this).attr('href'))
    },
    pressArrow: function(keyCode) {
        var $sibling, $all_links = this.$container.find('a:visible'), selected_index, $current;
        $all_links.each(function(i, el) {
            var $row = $(el)
            if ($row.hasClass('selected')) {
                selected_index = i
                $current = $row
                return false;
            }
        })

        $sibling = this.getSibling(keyCode == 38 ? 'prev' : 'next', $all_links, selected_index)

        if (typeof $current != 'undefined')
            $current.removeClass('selected')
        $sibling.addClass('selected')

        if ($sibling.length > 0)
            Suggestion.$search_field.val($sibling.find('.suggestion_title').html().toLowerCase())
    },
    keydown: function(e) {
        var keys = [38, 40, 13, 39, 35, 9]
        if ($.inArray(e.keyCode, keys) == -1) return true;
        if (e.keyCode == 9) e.preventDefault()
        if (e.keyCode == 13) Suggestion.searchSubmit()
        else if (e.keyCode == 40 || e.keyCode == 38 || e.keyCode == 9) Suggestion.pressArrow(e.keyCode)
        else {
            var val = $.trim($('.search .suggest_label').html());
            if (val != '') $(this).val(val);
        }
        $('.search .suggest_label').html('');
    },
    getSibling: function(direct, $all_links, selected_index) {
        var index;
        if (direct == 'next') index = selected_index + 1;
        else index = selected_index - 1;
        if (typeof selected_index == 'undefined' || typeof $all_links[index] == 'undefined') {
            if (direct == 'next') return $all_links.first()
            return $all_links.last()
        }
        else return $($all_links[index])
    },
    overLink: function() {
        $('#as_search a.selected').removeClass('selected')
        $(this).addClass('selected')
    },
    outLink: function() {
        $(this).removeClass('selected')
    },
    focusSearch: function() {
        Suggestion.is_active = true
        if ($.trim(Suggestion.$search_field.val()) != '') Suggestion.get()
        if(Suggestion.search_timeout) clearTimeout(Suggestion.search_timeout);
    },
    blurSearch: function() {
        $('.search .suggest_label').html('');
        Suggestion.is_active = false
        $('#as_search').fadeOut(200)
    },
    clickSearch: function() {
        var val = $.trim($('.search .suggest_label').html()),
        tbval = $(this).val();
        if (val != '' && val != tbval) $(this).val(val);
    }
};
