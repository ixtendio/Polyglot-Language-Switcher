// JavaScript Document


/* ---------------------------------------------------------------------- */
/* "Polyglot" Language Switcher
/* ----------------------------------------------------------------------
Version: 1.4
Author: Ixtendo
Author URI: http://www.ixtendo.com
License: MIT License
License URI: http://www.opensource.org/licenses/mit-license.php
------------------------------------------------------------------------- */


(function ($) {

    $.fn.polyglotLanguageSwitcher = function (op) {

        var ls = $.fn.polyglotLanguageSwitcher;

        var rootElement = $(this);
        var rootElementId = $(this).attr('id');
        var aElement;
        var ulElement = $("<ul class=\"dropdown\">");
        var length = 0;
        var isOpen = false;
        var liElements = new Array();
        var settings = $.extend({}, ls.defaults, op);
        var closePopupTimer;
        var isStaticWebSite = settings.websiteType == 'static';
        var store;
        if (isStaticWebSite) {
            store = new Persist.Store('Polyglot Language Switcher');
        }

        init();
        installListeners();

        function open() {
            aElement.addClass("active");
            doAnimation(true);
            setTimeout(function () {
                isOpen = true;
            }, 100);
        }

        function close() {
            doAnimation(false);
            aElement.removeClass("active");
            isOpen = false;
            if (closePopupTimer && closePopupTimer.active) {
                closePopupTimer.clearTimer();
            }
        }

        function suspendCloseAction() {
            if (closePopupTimer && closePopupTimer.active) {
                closePopupTimer.pause();
            }
        }

        function resumeCloseAction() {
            if (closePopupTimer) {
                closePopupTimer.play(false);
            }
        }

        function doAnimation(open) {
            if (settings.effect == 'fade') {
                if (open) {
                    ulElement.fadeIn(settings.animSpeed);
                } else {
                    ulElement.fadeOut(settings.animSpeed);
                }
            } else {
                if (open) {
                    ulElement.slideDown(settings.animSpeed);
                } else {
                    ulElement.slideUp(settings.animSpeed);
                }
            }
        }

        function doAction(item) {
            if (isOpen) {
                close();
            }
            var selectedAElement = $(item).children(":first-child");

            var selectedId = $(selectedAElement).attr("id");
            var selectedText = $(selectedAElement).text();

            $(ulElement).children().each(function () {
                $(this).detach();
            });
            for (var i = 0; i < liElements.length; i++) {
                if ($(liElements[i]).children(":first-child").attr("id") != selectedId) {
                    ulElement.append(liElements[i]);
                }
            }
            var innerSpanElement = aElement.children(":first-child");
            aElement.attr("id", selectedId);
            aElement.text(selectedText);
            aElement.append(innerSpanElement);
            if (isStaticWebSite) {
                store.set('lang', selectedId);
            }
        }

        function installListeners() {
            $(document).click(function () {
                if (isOpen) {
                    close();
                }
            });
            $(document).keyup(function (e) {
                if (e.which == 27 && isOpen) {
                    close();
                }
            });
            if (settings.openMode == 'hover') {
                closePopupTimer = $.timer(function () {
                    close();
                });
                closePopupTimer.set({ time:settings.hoverTimeout, autostart:true });
            }
        }

        function init() {
            var selectedItem;
            $("#" + rootElementId + " > form > select > option").each(function () {
                var selected = $(this).attr("selected");
                if (isStaticWebSite) {
                    var selectedId;
                    store.get('lang', function (ok, val) {
                        if (ok) {
                            selectedId = val;
                        }
                    });
                    if (selectedId == $(this).attr("id")) {
                        selected = true;
                    }
                }
                var liElement = toLiElement($(this));
                if (selected) {
                    selectedItem = liElement;
                }
                liElements.push(liElement);
                if (length > 0) {
                    ulElement.append(liElement);
                } else {
                    aElement = $("<a id=\"" + $(this).attr("id") + "\" class=\"current\" href=\"#\">" + $(this).text() + " <span class=\"trigger\">&raquo;</span></a>");
                    if (settings.openMode == 'hover') {
                        aElement.hover(function () {
                            if (!isOpen) {
                                open();
                            }
                            suspendCloseAction();
                        }, function () {
                            resumeCloseAction();
                        });
                    } else {
                        aElement.click(
                            function () {
                                if (!isOpen) {
                                    open();
                                }
                            }
                        );
                    }
                }
                length++;
            });
            $("#" + rootElementId + " form:first-child").remove();
            rootElement.append(aElement);
            rootElement.append(ulElement);
            if (selectedItem) {
                doAction(selectedItem);
            }
        }

        function toLiElement(option) {
            var id = $(option).attr("id");
            var value = $(option).attr("value");
            var text = $(option).text();
            var liElement;
            if (isStaticWebSite) {
                var urlPage = 'http://' + document.domain + '/' + settings.pagePrefix + id + '/' + settings.indexPage;
                liElement = $("<li><a id=\"" + id + "\" href=\"" + urlPage + "\">" + text + "</a></li>");
            } else {
                var href = document.URL.replace('#', '');
                var params = parseQueryString();
                params[settings.paramName] = value;
                if (href.indexOf('?') > 0) {
                    href = href.substring(0, href.indexOf('?'));
                }
                href += toQueryString(params);
                liElement = $("<li><a id=\"" + id + "\" href=\"" + href + "\">" + text + "</a></li>");
            }
            liElement.bind('click', function () {
                doAction($(this));
                if (settings.callback) {
                    settings.callback.call($(this), $(this).children(":first").attr('id'));
                }
            });
            if (settings.openMode == 'hover') {
                liElement.hover(function () {
                    suspendCloseAction();
                }, function () {
                    resumeCloseAction();
                });
            }
            return liElement;
        }

        function parseQueryString() {
            var params = {};
            var query = window.location.search.substr(1).split('&');
            if (query.length > 0) {
                for (var i = 0; i < query.length; ++i) {
                    var p = query[i].split('=');
                    if (p.length != 2) {
                        continue;
                    }
                    params[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
                }
            }
            return params;
        }

        function toQueryString(params) {
            if (settings.testMode) {
                return '#';
            } else {
                var queryString = '?';
                var i = 0;
                for (var param in params) {
                    var x = '';
                    if (i > 0) {
                        x = '&';
                    }
                    queryString += x + param + "=" + params[param];
                    i++;
                }
                return queryString;
            }
        }

    };

    var ls = $.fn.polyglotLanguageSwitcher;
    ls.defaults = {
        openMode:'click',
        hoverTimeout:1500,
        animSpeed:200,
        effect:'slide',
        paramName:'lang',
        pagePrefix:'',
        indexPage:'index.html',
        websiteType:'dynamic',
        testMode:false,
        callback:NaN
    };


})(jQuery);