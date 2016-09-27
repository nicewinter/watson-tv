var tv = {
  sendUrl: function() {
    var url = $('#tv-url').val();
    var video = $('#tv-video');
    var stack = [];

    $.post('https://residency.mybluemix.net/url', {url: url}, function(response) {
      'use strict';

      video.attr('src', url);
      video[0].load();

      var setText = function(rText, duration, deferred) {
        var split = rText.split(' ');
        var count = 0;
        var delay;

        if (duration > 0) {
          delay = duration / split.length * 1000;
        } else {
          delay = 0;
        }
        console.log('delay: ' + delay);

        var interval = setInterval(function() {
          console.log(split[count]);
          tv.text += ' ' + split[count];
          $('#tv-translation-text').html(tv.text);
          $("#tv-translation-text").animate({ scrollTop: $('#tv-translation-text')[0].scrollHeight }, 250);

          if (count++ === split.length - 1) {
            deferred.resolve();
            console.log('resolve');
            clearInterval(interval);
          }
        }, delay);
      };

      var doTimeout = function(r, deferred) {
        var currentTime = video[0].currentTime;
        var delay = currentTime - r.start * 1000;

        setTimeout(function() {
          setText(r.text, r.end - r.start, deferred);
        }, delay);
      };

      function asyncEvent(r) {
        console.log('async');
        var deferred = $.Deferred();
        var currentTime = video[0].currentTime;

        if (r.start <= currentTime) {
          console.log('set');
          setText(r.text, r.end - currentTime - 2, deferred);
        } else {
          console.log('timeout');
          doTimeout(r, deferred);
        }

        return deferred.promise();
      }

      var addToStack = function(r) {
        console.log('add to stack');
        stack.push(function() {
          asyncEvent(r);
        });
      };

      var d = $.Deferred().resolve();

      var nextPromise = function() {
        console.log('next promise');
        d = d.then(stack.shift());
      };

      // poll translation API for latest translations
      setInterval(function() {
        $.get('https://residency.mybluemix.net/translation', function(response) {
          if (response && response.length > 0) {
            video[0].play();

            if (tv.translations !== response.length) {
              for (var i = tv.translations; i < response.length; ++i) {
                tv.translations++;
                var r = response[i];
                console.log(r);
                r.end = r.end ? r.end : video[0].duration;

                r.text = r.text.charAt(0).toUpperCase() + r.text.slice(1);
                r.text = r.text.trim() + '.';

                if (stack.length === 0) {
                  console.log('start');
                  addToStack(r);
                  nextPromise();
                } else {
                  addToStack(r);
                }
              }
            }
          }
        });
      }, 3000);
    });
  },
  translations: 0,
  text: ""
};
