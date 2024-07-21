(function($) {
    $.fn.countdownTimer = function(options) {
        var settings = $.extend({}, $.fn.countdownTimer.defaults, options);

        this.each(function() {
            var progress_this = $(this);

            progress_this.append(`<div class='progress-bar bg-success' style='width: 100%'>${settings.timeLimit}s</div>`)
            var bar = $(this).find(".progress-bar");
            var start = new Date();
            var limit = settings.timeLimit * 1000;
            var warningFlag = false, dangerFlag = false;

            var interval = "";
            interval = window.setInterval(function() {
                var elapsed = new Date() - start;
                // console.log(elapsed)
                time_remaining = Math.floor((limit - elapsed)/1000);
                bar.width((100 - ((elapsed / limit) * 100)) + "%");

                bar.text(`${time_remaining}s`);

                if (elapsed >= settings.warningThreshold * 1000 && !warningFlag){
                    warningFlag = true;
                    bar.removeClass(settings.baseStyle)
                        .removeClass(settings.completeStyle)
                        .addClass(settings.warningStyle);
                }
                if (elapsed >= settings.dangerThreshold * 1000 && !dangerFlag){
                    dangerFlag = true;
                    bar.removeClass(settings.baseStyle)
                        .removeClass(settings.warningStyle)
                        .addClass(settings.completeStyle);
                }
                if (elapsed >= limit) {
                    window.clearInterval(interval);
                    progress_this.empty();
                    settings.onFinish.call(this);
                }

            }, 100);

            progress_this.data('interval', interval);

        });

        return this;
    };

    $.fn.stopCountdown = function() {
        this.each(function() {
            var interval = $(this).data('interval');
            if (interval) {
                window.clearInterval(interval);
                $(this).empty();
                $(this).removeData('interval');
            }
        });
        return this;
    };

    $.fn.countdownTimer.defaults = {
        timeLimit: 60, //total number of seconds
        warningThreshold: 5, //seconds remaining triggering switch to warning color
        dangerThreshold: 10, //seconds remaining triggering switch to danger color
        onFinish: function() {}, //invoked once the timer expires
        baseStyle: 'progress-bar-success', //bootstrap progress bar style at the beginning of the timer
        warningStyle: 'progress-bar-warning', //bootstrap progress bar style in the warning phase
        completeStyle: 'progress-bar-danger' //bootstrap progress bar style at completion of timer
    };
    
}(jQuery));
