// Github:   https://github.com/shdwjk/Roll20API/blob/master/OvaDice/OvaDice.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var OvaDice = OvaDice || (function () {
        'use strict';

        var version = '0.1.7',
            lastUpdate = 1435121689,
            schemaVersion = 0.1,

            checkInstall = function () {
                log('-=> OvaDice v' + version + ' <=-  [' + (new Date(lastUpdate * 1000)) + ']');

                if (!_.has(state, 'OvaDice') || state.OvaDice.version !== schemaVersion) {
                    log('  > Updating Schema to v' + schemaVersion + ' <');
                    state.OvaDice = {
                        version: schemaVersion
                    };
                }
            },

            getDiceCounts = function (msg, idx) {
                return (msg.inlinerolls &&
                msg.inlinerolls[idx] &&
                msg.inlinerolls[idx].results &&
                msg.inlinerolls[idx].results.rolls[0] &&
                msg.inlinerolls[idx].results.rolls[0].results &&
                (_.reduce(_.map(msg.inlinerolls[idx].results.rolls[0].results, function (r) {
                        return r.v;
                    }).sort() || [], function (m, r) {
                    m[r] = (m[r] || 0) + 1;
                    return m;
                }, {})));
            },

            getDiceArray = function (c) {
                return _.reduce(c, function (m, v, k) {
                    _.times(v, function () {
                        m.push(k);
                    });
                    return m;
                }, []);
            },

            handleInput = function (msg_orig) {
                var msg = _.clone(msg_orig),
                    args,
                    diceCounts,
                    maxMultiple = 0,
                    diceArray,
                    result,
                    reason,
                    w = false;

                if (msg.type !== "api") {
                    return;
                }

                if (_.has(msg, 'inlinerolls')) {
                    msg.content = _.chain(msg.inlinerolls)
                        .reduce(function (m, v, k) {
                            m['$[[' + k + ']]'] = v.results.total || 0;
                            return m;
                        }, {})
                        .reduce(function (m, v, k) {
                            return m.replace(k, v);
                        }, msg.content)
                        .value();
                }

                args = msg.content.split(/\s+/);
                switch (args.shift()) {
                    case '!wova':
                        w = true;
                    /* break; */ // Intentional drop through
                    case '!ova':
                        diceCounts = getDiceCounts(msg, 0);
                        if (!diceCounts) {
                            return;
                        }
                        diceArray = getDiceArray(diceCounts);

                        if (args.length > 1) {
                            reason = args.slice(1).join(' ');
                        }


                        maxMultiple = _.chain(diceCounts)
                            .map(function (c, r) {
                                return {
                                    label: 'Best Set',
                                    roll: r,
                                    count: c,
                                    total: (r * c)
                                };
                            })
                            .sortBy('total')
                            .reverse()
                            .first()
                            .value();
                        result = _.reduce([maxMultiple], function (m, e) {
                            return ((e && m && e.total > m.total) ? e : m);
                        });

                        sendChat(msg.who, (w ? '/w gm ' : '/em rolls ' +
                            '<span class="importantroll"' +
                            'style="border:2px solid #4A57ED;background-color: #FEF68E; ' +
                                    'padding: 0 3px 0 3px;' +
                                    'font-weight: bold;' +
                                    'cursor: help;' +
                                    'font-size: 1.1em;" title="' +
                            _.map(diceArray, function (r) {
                                return r;
                            }).join(', ') +
                            '">' + result.total + '</span>' +
                            (reason !== undefined ? reason : '')
                        ));

                        break;
                }
            },

            registerEventHandlers = function () {
                on('chat:message', handleInput);
            };

        return {
            CheckInstall: checkInstall,
            RegisterEventHandlers: registerEventHandlers
        };

    }());

on('ready', function () {
    'use strict';

    OvaDice.CheckInstall();
    OvaDice.RegisterEventHandlers();
});
