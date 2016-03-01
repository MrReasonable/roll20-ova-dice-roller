// Github:   https://github.com/shdwjk/Roll20API/blob/master/OvaDice/OvaDice.js
// By:       The Aaron, Arcane Scriptomancer
// Contact:  https://app.roll20.net/users/104025/the-aaron

var OvaDice = OvaDice || (function() {
        'use strict';

        var version = '0.1.7',
            lastUpdate = 1435121689,
            schemaVersion = 0.1,

            checkInstall = function() {
                log('-=> OvaDice v'+version+' <=-  ['+(new Date(lastUpdate*1000))+']');

                if( ! _.has(state,'OvaDice') || state.OvaDice.version !== schemaVersion) {
                    log('  > Updating Schema to v'+schemaVersion+' <');
                    state.OvaDice = {
                        version: schemaVersion
                    };
                }
            },

            getDiceCounts = function(msg,idx) {
                return ( msg.inlinerolls
                && msg.inlinerolls[idx]
                && msg.inlinerolls[idx].results
                && msg.inlinerolls[idx].results.rolls[0]
                && msg.inlinerolls[idx].results.rolls[0].results
                && (_.reduce(_.map(msg.inlinerolls[idx].results.rolls[0].results, function(r){
                        return r.v;
                    }).sort()  || [], function(m,r){
                    m[r]=(m[r]||0)+1;
                    return m;
                },{})));
            },

            getDiceArray = function(c) {
                return _.reduce(c,function(m,v,k){
                    _.times(v,function(){m.push(k);});
                    return m;
                },[]);
            },



            handleInput = function(msg_orig) {
                var msg = _.clone(msg_orig),
                    args,
                    diceCounts,
                    maxSingle=0,
                    maxMultiple=0,
                    maxRun=0,
                    diceArray,
                    bonus,
                    result,
                    bestOrBotch,
                    w=false;

                if (msg.type !== "api") {
                    return;
                }

                if(_.has(msg,'inlinerolls')){
                    msg.content = _.chain(msg.inlinerolls)
                        .reduce(function(m,v,k){
                            m['$[['+k+']]']=v.results.total || 0;
                            return m;
                        },{})
                        .reduce(function(m,v,k){
                            return m.replace(k,v);
                        },msg.content)
                        .value();
                }

                args = msg.content.split(/\s+/);
                switch(args.shift()) {
                    case '!wct':
                        w=true;
                    /* break; */ // Intentional drop through
                    case '!ova':

                        if(args.length>1){
                            bonus = parseInt(args[1],10);
                            bonus = _.isNaN(bonus) ? undefined : bonus;
                        }

                        diceCounts=getDiceCounts(msg,0);
                        if(!diceCounts){
                            return;
                        }
                        diceArray=getDiceArray(diceCounts);

                        maxMultiple=_.chain(diceCounts)
                            .map(function(c,r){
                                return {
                                    label: 'Best Set',
                                    roll: r,
                                    count: c,
                                    total: (r*c)
                                };
                            })
                            .sortBy('total')
                            .reverse()
                            .first()
                            .value();
                        result=_.reduce([maxMultiple],function(m,e){
                            return ( (e && m && e.total>m.total ) ? e : m);
                        });
                        bestOrBotch = '<div style="'+
                            'margin-top:8px;'+
                            'padding-top:8px;'+
                            'border-top: solid #731c20 1px;'+
                            '">'+
                            '<span style="'+
                            'font-weight: bold;'+
                            'color: #ab1e23;'+
                            '">'+
                            result.label+
                            ' :: '+
                            '</span>'+

                            _.map(
                                ( _.has(result,'count')
                                        ? (function(r,c){
                                        var d={};
                                        d[r]=c;
                                        return getDiceArray(d);
                                    }(result.roll,result.count))
                                        : result.run
                                ) ,function(r){
                                    return '<span style="'+
                                        'display:inline-block;'+
                                        'border-radius: 1em;'+
                                        'color: #000000;'+
                                        'border:2px solid #731c20;'+
                                        'background-color: #eae0e0;'+
                                        'padding:1px 5px;'+
                                        'margin: 1px 1px;'+
                                        '">'+r+'</span>';
                                }).join('') +
                            '</div>';

                        sendChat( msg.who, (w ? '/w gm ' : '/direct ')+
                            '<div style="'+
                            'background-color:#731c20;'+
                            'padding: 6px;'+
                            'margin-left: -45px;'+
                            'text-align: center;'+
                            'border-radius: 25px;'+
                            '">'+
                            '<div style="'+
                            'background: #eae0e0;'+
                            'color: #ffffff;'+
                            'padding: 8px;'+
                            'padding-left: 30px;'+
                            'border-radius: 25px;'+
                            'font-family: Arial, Verdana, Helvetica, sans-serif;'+
                            'font-weight: bold;'+
                            'postion: relative;'+
                            '">'+
                            '<div style="'+
                            'background: #731c20;'+
                            'padding: 8px;'+
                            'float:right;'+
                            'border: solid #731c20 1px;'+
                            'width: 100px;'+
                            'text-align: center;'+
                            'margin-left: 8px;'+
                            'border-radius: 25px;'+
                            '">'+
                            '<div style="'+
                            'font-size: large;'+
                            'color: #FFFFFF;'+
                            'font-weight: bold;'+
                            'border-radius: 25px;'+
                            '">'+
                            'Result'+
                            '</div>'+
                            '<div style="'+
                            'font-size: 2em;'+
                            'font-weight: bold;'+
                            'margin-top: 8px;'+
                            'margin-bottom: 12px;'+
                            'border-radius: 25px;'+
                            '">'+
                            (result.total+(bonus||0))+
                            '</div>'+
                            (!_.isUndefined(bonus)
                                    ? (
                                    '<span style="'+
                                    'margin-top:8px;'+
                                    'padding: 1px 0px 1px .3em;'+
                                        //'border: solid #323132 1px;'+
                                    'border: solid #731c20 1px;'+
                                    'border-radius: 1em;'+
                                    'background-color: #ab1e23;'+
                                    'font-weight: bold;'+
                                    '">'+
                                    '<span>'+
                                    result.total+
                                    '</span>'+
                                    ' + '+
                                    '<span style="'+
                                    'border: solid #731c20 1px;'+
                                    'border-radius: 1em;'+
                                    'padding: 1px .5em;'+
                                    'background-color: #FFFFFF;'+
                                    'color: white;'+
                                    'font-weight: normal;'+
                                    '">'+
                                    bonus+
                                    '</span>'+
                                    '</span>'
                                )
                                    : ''
                            )+
                            '</div>'+
                            '<div style="'+
                            'background: #FFFFFF;'+
                            'padding: 8px;'+
                            'margin-right: 138px;'+
                            'border: solid #731c20 1px;'+
                            'text-align:center;'+
                            'border-radius: 25px;'+
                            '">'+
                            '<div>'+
                            _.map(diceArray,function(r){
                                return '<span style="'+
                                    'display:inline-block;'+
                                    'border-radius: 1em;'+
                                    'color: #000000;'+
                                    'border:2px solid #731c20;'+
                                    'background-color: #eae0e0;'+
                                    'padding:1px 5px;'+
                                    'margin: 1px 1px;'+
                                    'border-radius: 25px;'+
                                    '">'+r+'</span>';
                            }).join('') +
                            '</div>'+
                            bestOrBotch+
                            '</div>'+
                            '<div style="clear:both;border-radius: 25px;"></div>'+
                            '</div>'+
                            '</div>'
                        );

                        break;
                }
            },

            registerEventHandlers = function() {
                on('chat:message', handleInput);
            };

        return {
            CheckInstall: checkInstall,
            RegisterEventHandlers: registerEventHandlers
        };

    }());

on('ready',function() {
    'use strict';

    OvaDice.CheckInstall();
    OvaDice.RegisterEventHandlers();
});
