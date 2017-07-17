const moment = require('moment');
const builder = require('botbuilder');
const restify = require('restify');
const server = restify.createServer();

// Setup bot
const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Setup LUIS
const recognizer = new builder.LuisRecognizer('https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/3add9274-63c0-4c28-8ae9-b4367d22d25a?subscription-key=ca9377b54a90423dbdfc49f7a6e6bc1c&timezoneOffset=60&verbose=true&q=');
const intents = new builder.IntentDialog({ recognizers: [recognizer] });

// Setup Intents
intents.matches('Saludar', function (session, results) {
    session.send('Hola ¿En que te puedo ayudar?');
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

//********************************************************************************************* */
// Setup Restify Server
server.listen(process.env.port || process.env.PORT || 8080, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
// Listen for messages from users 
server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector);
bot.dialog('/', intents);