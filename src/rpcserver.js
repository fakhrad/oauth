var amqp = require('amqplib/callback_api');
var db = require('./config/init-db');
var cityController = require('./controllers/cityController');
var userController = require('./controllers/userController');
var cltController = require('./controllers/clientController');
var adminController = require('./controllers/adminController');
var spaceController = require('./controllers/spaceController');
var oauth = require('./config/init-auth')

var rabbitHost = process.env.RABBITMQ_HOST || "amqp://gvgeetrh:6SyWQAxDCpcdg1S0Dc-Up0sUxfmBUVZU@chimpanzee.rmq.cloudamqp.com/gvgeetrh";

var amqpConn = null;
function start() {
    console.log('Start connecting : ' + rabbitHost );;
  amqp.connect(rabbitHost, (err, conn)=>{
    if (err) {
        console.error("[AMQP]", err.message);
        return setTimeout(start, 1000);
      }
    conn.on("error", function(err) {
      if (err.message !== "Connection closing") {
        console.error("[AMQP] conn error", err.message);
      }
    });
    conn.on("close", function() {
      console.error("[AMQP] reconnecting");
      return setTimeout(start, 1000);
    });

    console.log("[AMQP] connected");
    amqpConn = conn;

    whenConnected();
  });
}
function whenConnected() {

    ///Users management channel
    amqpConn.createChannel( (err, ch) => {
        if (err) {
            console.error("[AMQP]", err.message);
            return setTimeout(start, 1000);
        }
        ch.on("error", function(err) {
        console.error("[AMQP] channel error", err.message);
        return setTimeout(this.startconnect, 1000);
        });
        ch.on("close", function() {
        console.log("[AMQP] channel closed");
        return setTimeout(this.startconnect, 1000);
        });
        console.log('Client connected.');
        this.channel = ch;

        ch.prefetch(10);
        console.log('Authentication service broker started!');
      //Token API
      ch.assertQueue("token", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              console.log('Token request recieved')
              var req = JSON.parse(msg.content.toString('utf8'));
              if (!req.body.password)
                req.body.password = req.body.username;
              if (!req.body.grant_type)
                req.body.grant_type = "password";
                oauth.token(req,  {}, {}, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
          });
      });
  
       //Token API
    ch.assertQueue("authenticate", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            console.log('Authenticate request recieved')
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            oauth.authenticate(req,  {}, {}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
     //Token API
     ch.assertQueue("authorize", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            console.log('Authorize request recieved')
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            oauth.authorize(req,  {}, {}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ///AddUser Api
    ch.assertQueue("register", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            console.log('register user started')
            var req = JSON.parse(msg.content.toString('utf8'));
            if (!req.username)
                req.username = req.phoneNumber;
            if (!req.password)
                req.password = req.phoneNumber;
            userController.registeruser({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
      ///Is Valid Login Api
      ch.assertQueue("verifycode", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.verifycode({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
  
      ///FindById Api
      ch.assertQueue("findbyid", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.findById({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
     ///FindByPhone Api
     ch.assertQueue("findbyphone", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.findbyphone({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeCity Api
      ch.assertQueue("changecity", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changecity({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///RequestCode Api
      ch.assertQueue("requestcode", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.requestcode({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeNumber API
      ch.assertQueue("changenumber", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changenumber({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          }); 
      });
      ///ChangeAvatar Api
      ch.assertQueue("changeavatar", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changeavatar({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeLanguage Api
      ch.assertQueue("changelanguage", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changelanguage({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeNotification Api
      ch.assertQueue("changenotification", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changenotification({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///UpdateProfile Api
      ch.assertQueue("updateprofile", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.updateprofile({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///DeleteAccount Api
      ch.assertQueue("deleteaccount", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.deleteaccount({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///LocationChanged Api
      ch.assertQueue("locationchanged", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.locationchanged({body : req}, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });

      ///Clients management apis
      //RegisterClient API
      ch.assertQueue("registerapp", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.addClient({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //RemoveClient API
      ch.assertQueue("removeapp", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.deleteClient({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //UpdateClient API
      ch.assertQueue("updateapp", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.updateClient({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //GetAllClients API
      ch.assertQueue("getuserapps", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.findByUserId({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });

            //GetAllClients API
      ch.assertQueue("getspaceapps", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.findBySpaceId({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //GetAllClients API
      ch.assertQueue("getuserappbyid", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.findbyid({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });

      ///GetCities Api
      ch.assertQueue("getcities", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cityController.getcities({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("adminregister", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            adminController.registeruser(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("adminlogin", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            adminController.token(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("admingetforgotpasswordtoken", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            adminController.getforgotpasswordtoken(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("adminresetpassword", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            adminController.resetpassword(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("adminchangepassword", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            adminController.changepassword(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ///Spaces management api
    //AddSpace API
    ch.assertQueue("addspace", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            spaceController.addSpace({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    //Remove Space API
    ch.assertQueue("removespace", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            spaceController.deleteSpace({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    //Update Space API
    ch.assertQueue("updatespace", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            spaceController.updateSpace({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    //Get Space By Id API
    ch.assertQueue("getspacebyid", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            spaceController.findbyid({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    //Get Space By User Id API
    ch.assertQueue("getspacebyuserid", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            spaceController.findByUserId({body : req}, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    });
  };
start();
// initialize database
db();