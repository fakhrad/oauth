var amqp = require('amqplib/callback_api');
var db = require('./config/init-db');
var cityController = require('./controllers/cityController');
var userController = require('./controllers/userController');
var cltController = require('./controllers/clientController');
var adminController = require('./controllers/adminController');
var oauth = require('./config/init-auth');
var spaceController = require('./controllers/spaceController');

var rabbitHost = process.env.RABBITMQ_HOST || "amqp://gvgeetrh:6SyWQAxDCpcdg1S0Dc-Up0sUxfmBUVZU@chimpanzee.rmq.cloudamqp.com/gvgeetrh";
//var rabbitHost = process.env.RABBITMQ_HOST || "amqp://localhost:5672";

var amqpConn = null;
var channel = undefined;
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
            //return setTimeout(start, 1000);
        }
        channel = ch;
        ch.on("error", function(err) {
        console.error("[AMQP] channel error", err.message);
        //return setTimeout(this.startconnect, 1000);
        });
        ch.on("close", function() {
        console.log("[AMQP] channel closed");
        //return setTimeout(this.startconnect, 1000);
        });
        console.log('Client connected.');
        this.channel = ch;

        ch.prefetch(1);
        channel = ch;
        console.log('Authentication service broker started!');
      //Token API
    ch.assertQueue("token", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            console.log('Token request recieved')
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                if (!req.body.username)
                    req.body.username = req.body.phoneNumber;
                if (!req.body.grant_type)
                    req.body.grant_type = "password";
                if (req.body.grant_type == "password")
                {
                    if (!req.body.password)
                        req.body.password = req.body.username;
                }
                oauth.token(req,  {}, {}, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
                }
                catch(ex)
                {
                console.log(ex);
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                }
            
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
            if (!req.body.username)
                req.body.username = req.body.phoneNumber;
            if (!req.body.password)
                req.body.password = req.body.phoneNumber;
            userController.registeruser(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
      ///Is Valid Login Api
      ch.assertQueue("verifycode", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.verifycode(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
  
      ///FindById Api
      ch.assertQueue("findbyid", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.findById(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
     ///FindByPhone Api
     ch.assertQueue("findbyphone", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.findbyphone(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeCity Api
      ch.assertQueue("changecity", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changecity(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///RequestCode Api
      ch.assertQueue("requestcode", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.requestcode(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeNumber API
      ch.assertQueue("changenumber", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changenumber(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          }); 
      });
      ///ChangeAvatar Api
      ch.assertQueue("changeavatar", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changeavatar(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeLanguage Api
      ch.assertQueue("changelanguage", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changelanguage(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///ChangeNotification Api
      ch.assertQueue("changenotification", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.changenotification(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///UpdateProfile Api
      ch.assertQueue("updateprofile", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.updateprofile(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///DeleteAccount Api
      ch.assertQueue("deleteaccount", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.deleteaccount(req, (result)=>{
                  ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
              });
          });
      });
      ///LocationChanged Api
      ch.assertQueue("locationchanged", {durable: false}, (err, q)=>{
          ch.consume(q.queue, function reply(msg) {
              var req = JSON.parse(msg.content.toString('utf8'));
              userController.locationchanged(req, (result)=>{
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
            console.log(req);
            cltController.addClient(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //RemoveClient API
      ch.assertQueue("removeapp", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.deleteClient(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //UpdateClient API
      ch.assertQueue("updateapp", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.updateClient(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });

     //GetAllClients API
      ch.assertQueue("getapps", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            cltController.findBySpaceId(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });
      //GetAllClients API
      ch.assertQueue("getappbyid", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cltController.findbyid(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
      });

      ///GetCities Api
      ch.assertQueue("getcities", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            cityController.getcities(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
        });
    });
    ch.assertQueue("adminregister", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.registeruser(req, (result)=>{
                                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                                ch.ack(msg);
                            });
              }
            catch(ex)
              {
                console.log(ex);
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
              } 
        });
    });

    ch.assertQueue("adminadduser", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.adduser(req, (result)=>{
                                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                                ch.ack(msg);
                            });
              }
            catch(ex)
              {
                console.log(ex);
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
              } 
        });
    });
    ch.assertQueue("adminlogin", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.token(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 
        });
    });

    ch.assertQueue("adminupdateprofile", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.updateprofile(req, (result)=>{
                                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                                ch.ack(msg);
                            });
            }
            catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            }
        });
    });

    ch.assertQueue("admingetforgotpasswordtoken", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.getforgotpasswordtoken(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });

    ///ChangeNotification Api
    ch.assertQueue("adminchangenotification", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log(req);
            try{
            adminController.changenotification(req, (result)=>{
                ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                ch.ack(msg);
            });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("adminresetpassword", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.resetpassword(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("adminchangeavatar", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.changeavatar(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("getadminuserinfo", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.findbyId(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("adminconfirmemail", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.confirmemail(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("adminchangepassword", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.changepassword(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
    ch.assertQueue("admindeleteaccount", {durable: false}, (err, q)=>{
        ch.consume(q.queue, function reply(msg) {
            var req = JSON.parse(msg.content.toString('utf8'));
            try{
                adminController.deleteaccount(req, (result)=>{
                    ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(result)), { correlationId: msg.properties.correlationId } );
                    ch.ack(msg);
                });
            }
          catch(ex)
            {
              console.log(ex);
              ch.sendToQueue(msg.properties.replyTo, new Buffer.from(JSON.stringify(ex)), { correlationId: msg.properties.correlationId } );
                  ch.ack(msg);
            } 

        });
    });
  

    //Exchanges
    var exchange = 'adminauth';

    ch.assertExchange(exchange, 'direct', {
      durable: false
    });

    ch.assertExchange("contentservice", 'direct', {
        durable: false
    });
    ch.assertQueue("", {durable: false, exclusive : true}, (err, q)=>{
        if (!err)
        {
          ch.bindQueue(q.queue, "contentservice", "spacecreated")
          ch.consume(q.queue, function(msg) {
            // console.log(msg);
            var req = JSON.parse(msg.content.toString('utf8'));
            console.log("New space created. adding to local database",);
            try
            {
                spaceController.createuserspace(req, (result)=> {});
            }
            catch(ex)
            {
                console.log(ex);
            }
          }, {
            noAck: true
          });
        }
      });
    });
  };
start();
// initialize database
db();

exports.publish = function(exchange, queue, message)
{
    console.log(message);
    channel.publish(exchange, queue, Buffer.from(JSON.stringify({body : message})));
    console.log('publishing message to : ' + exchange + " : " + queue);
}