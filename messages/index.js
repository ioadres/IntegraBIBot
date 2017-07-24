const moment = require('moment');
const builder = require('botbuilder');
const botbuilder_azure = require("botbuilder-azure");
const path = require('path');
const request = require('request');

const url = "http://integrabiapi.azurewebsites.net/api/ReportBot/GetReports?UserId="
const environment = process.env['BotEnv'] || 'development';

const cardtemp = {
    contentType: "application/vnd.microsoft.card.adaptive",
    content: {
        type: "AdaptiveCard",
        body: [{
                "type": "TextBlock",
                "text": "Reporte : ",
                "size": "large",
                "weight": "bolder"
            },
            {
                "type": "TextBlock",
                "text": "*Descripción*"
            }
        ],
        "actions": [{
            "type": "Action.OpenUrl",
            "url": "http://adaptivecards.io",
            "title": "Acceder"
        }]
    }
};




var useEmulator = (environment == 'development');

var connector = useEmulator ? new builder.ChatConnector({
       appId: '', //process.env.MICROSOFT_APP_ID,
    appPassword: ''// process.env.MICROSOFT_APP_PASSWORD //f1Qak4SsFgYn4Y3eFd4Xi4k
    }) :
    new botbuilder_azure.BotServiceConnector({
        appId: process.env['MicrosoftAppId'],
        appPassword: process.env['MicrosoftAppPassword'],
        stateEndpoint: process.env['BotStateEndpoint'],
        openIdMetadata: process.env['BotOpenIdMetadata']
    });

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(8080, function() {
        console.log('test bot endpont at http://localhost:8080/api/messages');
    });
    server.post('/api/messages', connector.listen());
} else {
    module.exports = { default: connector.listen() }
}

// Setup LUIS
const recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3add9274-63c0-4c28-8ae9-b4367d22d25a?subscription-key=ca9377b54a90423dbdfc49f7a6e6bc1c&timezoneOffset=60&verbose=true&q=');
const intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Setup Intents
intents.matches('Saludar', function(session, results) {

    console.log(session.message.user.id);
    console.log(session.message.user.name);

    session.send('Hola ¿En que te puedo ayudar? ' + session.message.user.id);
});


intents.matches('Solicitar', [
    function(session, results, next) {
        
    }
]);

intents.matches('Listar', function(session, results) {
    getReports(builder, session);
});

function getReports(builder, session) {

    request("http://integrabiapi.azurewebsites.net/api/ReportBot/GetCharts?UserId="+session.message.user.id, function (error, response, body) {
        //session.message.user.id
        if(response && response.statusCode == 200) {
                        
            session.send('Tengo disponible estos gráficos para ti!');

            var charts = JSON.parse(body);
            var msg = new builder.Message(session);

            for (var i = 0; i < charts.length; i++) {
                msg.addAttachment(getCard(charts[i].name, charts[i].description, charts[i].url));
            }

            session.send(msg).endDialog();
        }
        
    });

    
}

intents.matches('Limpiar', function(session, results) {

});

intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir'));


bot.dialog('/', intents);

function getCard(title, description, url) {
    var currentCard = {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
            type: "AdaptiveCard",
            body: [{
                    "type": "TextBlock",
                    "text": "Reporte : ",
                    "size": "large",
                    "weight": "bolder"
                },
                {
                    "type": "TextBlock",
                    "text": "*Descripción*"
                }
            ],
            "actions": [{
                "type": "Action.OpenUrl",
                "url": "http://adaptivecards.io",
                "title": "Acceder"
            }]
        }
    };

    currentCard.content.body[0].text = title;
    currentCard.content.body[1].text = description;
    currentCard.content.actions[0].url = url;
    return currentCard;
}