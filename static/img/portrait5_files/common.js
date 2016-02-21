$(document).ready(function() {
    Downloader.init()
})

var Uploader = {
    onMediaUploaded: null,
    openPopup: function(options) {
        if (!options) options = {}
        if (!options.type) options.type = 1

        if (options.onMediaUploaded) {
            this.onMediaUploaded = options.onMediaUploaded
        }
        var url = '/uploading?' + $.param(options)

        var date = new Date()
        var window_id = date.getTime()
        var params = 'height=550, width=650, status = no, toolbar = no, menubar = no, resizable = no'
        window.open(url, 'id' + window_id, params);
    }
}

var Downloader = {
    queue: [],
    isProcessing: false,
    init: function() {
        $(document).off('click', '[data-download]')
        $(document).on('click', '[data-download]', function() {
            Downloader.download($(this))
        })
    },
    processQueue: function() {
        if (this.isProcessing) return
        this.isProcessing = true
        var $btn = this.queue.shift(),
            self = this,
            id = $btn.data('download'),
            url =' /media_x/download/' + id

        cometNotifier.subscribe('dl' + id + '_' + APPINIT.userId, function() {
            $btn.removeClass('btn_disabled').text('Re-download')
            self.isProcessing = false
            if (self.queue.length > 0) {
                self.processQueue()
            }
        })
        $('<iframe>', {src: url}).hide().appendTo('body')
    },
    download: function($btn) {
        if (!$btn.length || $btn.hasClass('btn_disabled')) return
        $btn.addClass('btn_disabled').text('Downloading...')
        this.queue.push($btn)
        this.processQueue()
    }
}