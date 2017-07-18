const moment = require('moment');
const builder = require('botbuilder');
const botbuilder_azure = require("botbuilder-azure");
const path = require('path');
const environment = process.env['BotEnv'] || 'development';

var useEmulator = (environment == 'development');

var connector = useEmulator ? new builder.ChatConnector({
    appId: '',
    appPassword: ''
})
: new botbuilder_azure.BotServiceConnector({
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
intents.matches('Saludar', function (session, results) {
    console.log(session.message.user.id);
    console.log(session.message.user.name);
    session.send('Hola ¿En que te puedo ayudar? ' + session.message.user.id);

    
    $("#ValueReportParent").val("Dolly Duck");
});


intents.matches('Solicitar', [    
    function (session, results, next) {
        const reportes = ['Reporte 1', 'reporte 2', 'reporte 3', 'reporte 4'];
        var reporte = builder.EntityRecognizer.findEntity(results.entities, 'reporte');
        if(!reporte){
            getReports(builder,session);
        } else {
            console.log(reporte.entity);
        }
    }
]);

intents.matches('Listar', function (session, results) {
    getReports(builder, session);
});

function getReports(builder, session) {
    const reportes = ['Reporte 1', 'reporte 2', 'reporte 3', 'reporte 4'];
    session.send('Upss! No he logrado identificar el reporte');
    builder.Prompts.choice(session, 'Tengo disponible estos reportes para ti! : ', reportes);
}

intents.matches('Limpiar', function (session, results) {
    session.send('Se ha limpiado el reprote');
});

intents.onDefault(builder.DialogAction.send('No he entendido lo que quieres decir'));


bot.dialog('/', intents);
