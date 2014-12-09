/*global moment, clearInterval: false, clearTimeout: false, document: false, event: false, frames: false, history: false, Image: false, location: false, name: false, navigator: false, Option: false, parent: false, screen: false, setInterval: false, setTimeout: false, window: false, XMLHttpRequest: false */
var hl = (function (hl) {
    "use strict";
    var easyXDM = window.easyXDM || {};
    hl.extend = function (obj) {
        var breaker = {}, each = function (o, iterator, context) {
            var i, l, key;
            if (o === null) { return; }
            if (Array.prototype.forEach && o.forEach === Array.prototype.forEach) {
                o.forEach(iterator, context);
            } else if (o.length === +o.length) {
                for (i = 0, l = o.length; i < l; i = i + 1) {
                    if (iterator.call(context, o[i], i, o) === breaker) { return; }
                }
            } else {
                for (key in o) {
                    if (o.hasOwnProperty(key)) {
                        if (iterator.call(context, o[key], key, o) === breaker) { return; }
                    }
                }
            }
        };
        each(Array.prototype.slice.call(arguments, 1), function (source) {
            var prop;
            if (source) {
                for (prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        obj[prop] = source[prop];
                    }
                }
            }
        });
        return obj;
    };

    hl.latestDiscussion = function (el, settings) {
        var base = this;
        base.settings = settings;
        base.el = el = document.getElementById(el);
        base.defaultSettings = {
            subjectLength: 50,
            contentLength: 160,
            moreUrl: '',
            postUrl: '',
            showLoginStatus: 0,
            loginUrl: '',
            includeStaff: true,
            useBioBubble: 0,
            discussionKey: ''
        };
        base.init = function () {
            base.settings = hl.extend({}, base.defaultSettings, base.settings);
            base.easyXDMInit();
        };
        base.easyXDMInit = function () {
            var scripts = document.getElementsByTagName('script'),
                scriptIdx,
                i,
                j,
                easyXDMElement,
                regEx = new RegExp('MSIE ([0-9]{1,}[0-9]{0,})'),
                uA = navigator.userAgent,
                getIndexOf = function (obj, start) {
                    for (i = (start || 0), j = this.length; i < j; i = i + 1) {
                        if (this[i] === obj) {
                            return i;
                        }
                    }
                    return -1;
                },
                getDiscussions = function () {
                    base.discussionWidget.getLatestDiscussion();
                },
                consumerRpcConfig = { remote: document.location.protocol + '//api.connectedcommunity.org/Scripts/easyXDM/cors/' },
                consumerJsonRpcConfig = { remote: { request: {} }},
                bioBubbleKeys = {},
                $ = window.jQuery || undefined,
                allBioBubbleKeys;

            if (window.jQuery !== undefined && $ !== undefined) {
                allBioBubbleKeys = $("[biobubblekey]");
            }

            for (scriptIdx = 0; scriptIdx < scripts.length; scriptIdx = scriptIdx + 1) {
                if (scripts[scriptIdx].src === document.location.protocol + '//api.connectedcommunity.org/Scripts/EasyXDM/easyXDM.js') {
                    window.isEasyXDMPresent = true;
                }

                if (!Array.prototype.indexOf) {
                    Array.prototype.indexOf = getIndexOf;
                }
                /***** Load easyXDM if not present ******/
                if (easyXDM === 'undefined') {
                    easyXDMElement = document.createElement('script');
                    easyXDMElement.type = 'text/javascript';
                    easyXDMElement.src = document.location.protocol + '//api.connectedcommunity.org/Scripts/EasyXDM/easyXDM.js';
                    el.parentNode.insertBefore(easyXDMElement, el);

                    if (navigator.appName === 'Microsoft Internet Explorer') {
                        if (regEx.exec(uA) !== null) {
                            if (parseFloat(RegExp.$1) < 9) {
                                easyXDMElement.attachEvent('onreadystatechange', getDiscussions);
                            } else {
                                easyXDMElement.onload = getDiscussions;
                            }
                        }
                    } else {
                        easyXDMElement.onload = getDiscussions;
                    }
                } else {
                    base.discussionWidget.getLatestDiscussion();
                }
            }
            base.discussionWidget = {
                onRpcSuccess: function (response) {
                    var widgetWrapper,
                        emptyMessage = 'No data found.',
                        discussions = JSON.parse(response.data),
                        discussionSubject,
                        discussionBody,
                        widgetHTML = '<div class="border">' +
                            '<div class="container">' +
                            '<ul>',
                        limit = Math.min(base.settings.maxToRetrieve, discussions.length),
                        k,
                        moreUrlMarkup = "",
                        emptyGuid = '00000000-0000-0000-0000-000000000000',
                        currentUserContactKey,
                        bKey,
                        element = 'login-information-container';

                    if (el.nextSibling !== null && el.nextSibling.nodeName === 'DIV') {
                        if (el.nextSibling.className !== 'hl-widget latest-discussion') {
                            widgetWrapper = document.createElement('div');
                            widgetWrapper.setAttribute('class', 'hl-widget latest-discussion');
                        } else {
                            widgetWrapper = el.nextSibling;
                            widgetWrapper.innerHTML = '';
                        }
                    } else {
                        widgetWrapper = document.createElement('div');
                        widgetWrapper.setAttribute('class', 'hl-widget latest-discussion');
                    }

                    for (k = 0; k < limit; k = k + 1) {
                        discussionSubject = (discussions[j].Subject.length > base.settings.subjectLength) ? discussions[j].Subject.substr(0, base.settings.subjectLength) + '...' : discussions[j].Subject;
                        discussionBody = (discussions[j].BodyWithoutMarkup.length > base.settings.contentLength) ? discussions[j].BodyWithoutMarkup.substr(0, base.settings.contentLength) + '...' : discussions[j].BodyWithoutMarkup;

                        widgetHTML += '<li>' +
                            '<div class="item-header-container">' +
                            '<div class="item-image-container" biobubblekey="' + discussions[j].Author.ContactKey + '">' +
                            '<a href="' + discussions[j].Author.LinkToProfile + '" class="user-image-container">' +
                            '<img class="item-image" src="' + discussions[j].Author.PictureUrl + '" />' +
                            '</a>' +
                            '</div>' +
                            '<div class="item-title-container">' +
                            '<a title="' + discussions[j].Subject + '" href="' + discussions[j].LinkToMessage + '">' + discussionSubject + '</a>' +
                            '</div>' +
                            '<div class="item-by-line-container">' +
                            '<span>By: </span><a href="' + discussions[j].Author.LinkToProfile + '" biobubblekey="' + discussions[j].Author.ContactKey + '">' + discussions[j].Author.DisplayName + '</a>' +
                            '<span>, ' + moment(discussions[j].DatePosted).startOf('seconds').fromNow() + ' </span>' +
                            '</div>' +
                            '<div class="item-posted-in-container">' +
                            '<span>Posted in: </span><a href="' + discussions[j].LinkToDiscussion + '">' + discussions[j].DiscussionName + '</a>' +
                            '</div>' +
                            '</div>' +
                            '<div class="item-body-container">' + discussionBody + '</div>' +
                            '</li>';
                    }

                    if (discussions.length === 0) {
                        widgetHTML += '<li>' +
                            '<div class="empty">' + emptyMessage + '</div>' +
                            '</li>';
                    }

                    //Only display More URL if we actually got discussions back.
                    if (base.settings.moreUrl !== "" && base.settings.moreUrl.length > 0 && discussions.length > 0) {
                        moreUrlMarkup = '<div class="footer-item-more"><a href="' + base.settings.moreUrl + '">More</a></div>';
                    }
                    widgetHTML += '</ul>' +
                        '<div class="footer-container">' +
                        moreUrlMarkup +
                        '</div>' +
                        '</div>';

                    if ((base.settings.showLoginStatus === '1' || base.settings.showLoginStatus === 1) && base.settings.loginUrl.length > 0) {
                        widgetHTML += '<div id="login-information-container"></div>' +
                            '</div>';

                    } else {
                        widgetHTML += '</div>';
                    }

                    widgetWrapper.innerHTML = widgetHTML;
                    el.parentNode.insertBefore(widgetWrapper, el.nextSibling);

                    if (base.settings.useBioBubble === '1' || base.settings.useBioBubble === 1) {
                        if (response.headers.CurrentContactKey !== 'undefined' &&
                                response.headers.CurrentContactKey !== emptyGuid) {
                            currentUserContactKey = response.headers.CurrentContactKey;
                        } else {
                            currentUserContactKey = emptyGuid;
                        }

                        allBioBubbleKeys.each(function () {
                            bioBubbleKeys[$(this).attr('biobubblekey')] = true; // get distinct list of keys
                        });

                        for (bKey in bioBubbleKeys) {
                            if (bioBubbleKeys.hasOwnProperty(bKey)) {
                                $('#' + 'bioBubbleShell' + bKey).hl_ui_bioBubble({
                                    displayContactKey: bKey,
                                    currentContactKey: currentUserContactKey,
                                    HLIAMKey: base.settings.HLIAMKey,
                                    eventTriggers: $('[biobubblekey="' + bKey + '"]')
                                });
                            }
                        }
                    }
                    if ((base.settings.showLoginStatus === '1' || base.settings.showLoginStatus === 1) && base.settings.loginUrl.length > 0) {
                        hl.ldWhoAmI(element, { HLIAMKey: base.settings.HLIAMKey, domainLoginUrl: base.settings.loginUrl });
                    }
                },
                onRpcFailure: function (response) {
                    var widgetErrorMessage;
                    if (el.nextSibling !== null && el.nextSibling.nodeName === 'DIV') {
                        if (el.nextSibling.className !== 'hl-widget latest-discussion') {
                            widgetErrorMessage = document.createElement('div');
                            widgetErrorMessage.setAttribute('class', 'hl-widget latest-discussion');
                        } else {
                            widgetErrorMessage = el.nextSibling;
                            widgetErrorMessage.innerHTML = '';
                        }
                    } else {
                        widgetErrorMessage = document.createElement('div');
                        widgetErrorMessage.setAttribute('class', 'hl-widget latest-discussion');
                    }
                    widgetErrorMessage.innerHTML = '<div class="border"><div class="container"><div class="error-message">Error: ' + JSON.parse(response.data.data).Message + '</div></div></div>';
                    el.parentNode.insertBefore(widgetErrorMessage, el.nextSibling);
                },
                getLatestDiscussion: function () {
                    var urlParams = [base.settings.discussionKey, base.settings.maxToRetrieve, base.settings.includeStaff],
                        buildUrlPath = function (params) {
                            var currentParam,
                                retStr = '?',
                                paramNames = ['discussionKey', 'maxToRetrieve', 'includeStaff'],
                                pIdx;

                            for (pIdx = 0; pIdx < params.length; pIdx = pIdx + 1) {
                                currentParam = params[pIdx];
                                if (currentParam !== undefined && currentParam !== '') {
                                    if (retStr.charAt(retStr.length - 1) !== '?') {
                                        retStr = retStr + '&';
                                    }
                                    retStr = retStr + paramNames[pIdx] + '=' + currentParam;
                                }
                            }
                            return (retStr === '?') ? '' : retStr;
                        },
                        requestConfig = {
                            url: document.location.protocol + '//api.connectedcommunity.org/api/v2.0/Discussions/GetDiscussionPosts' + buildUrlPath(urlParams),
                            method: 'GET',
                            headers: {
                                'HLIAMKey': base.settings.HLIAMKey,
                                'Accept': 'application/json',
                                'Content-Type': 'application/json'
                            }
                        },
                        rpc;

                    if (easyXDM !== 'undefined') {
                        rpc = new easyXDM.Rpc(consumerRpcConfig, consumerJsonRpcConfig);
                        rpc.request(requestConfig, base.discussionWidget.onRpcSuccess, base.discussionWidget.onRpcFailure);
                    }
                }
            };
            base.init();
        };
        window.HL = hl;
    };
}(window.HL || {}));
var hl = (function (hl) {
    "use strict";
    var easyXDM = window.easyXDM || {},
        t = {
            HLIAMKey: "00000000-0000-0000-0000-000000000000",
            consumerRpcConfig: {
                remote: document.location.protocol + "//api.connectedcommunity.org/Scripts/easyXDM/cors/"
            },
            consumerJsonRpcConfig: {
                remote: {
                    request: {}
                }
            }
        };

    hl.ldWhoAmI = function (el, n) {
        n = hl.extend(t, n);
        var r = {
            url: document.location.protocol + "//api.connectedcommunity.org/api/v2.0/Contacts/GetWhoAmI",
            method: "GET",
            headers: {
                HLIAMKey: n.HLIAMKey,
                Accept: "application/json",
                "Content-Type": "application/json"
            }
        },
            i = document.getElementById(el),
            s = new easyXDM.Rpc(n.consumerRpcConfig, n.consumerJsonRpcConfig);
        if (i !== undefined || i !== null) {
            s.request(r, function (e) {
                var elt = JSON.parse(e.data);
                if (elt !== null) {
                    i.innerHTML = '<a target="_blank" href="' + elt.LinkToProfile + '">' + elt.DisplayName + "</a>";
                } else {
                    i.innerHTML = '<a href=\"' + n.domainLoginUrl + '\">Login</a>';
                }
            }, function () {
                i.innerHTML = '<a href=\"' + n.domainLoginUrl + '\">Login</a>';
            });
        }
    };
}(window.HL || {}));