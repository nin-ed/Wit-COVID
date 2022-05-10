"use-strict";

const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const fetch = require("node-fetch");
const handler = require("./wit_handler");

const Wit = require("node-wit").Wit;
const log = require("node-wit").log;

const PORT = process.env.PORT || 8805;
const WIT_TOKEN = process.env.WIT_TOKEN;
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_APP_SECRET = process.env.FB_APP_SECRET;
  
if(!FB_PAGE_TOKEN){
    throw new Error("FB_PAGE_TOKEN is missing!")
}
if(!FB_APP_SECRET){
    throw new Error("FB_APP_SECRET is missing!")
}


// Messenger API
const fbMessage = (id, text) => {
    const body = JSON.stringify({recipient: {id}, message: {text}});
    const qs = "access_token=" + encodeURIComponent(FB_PAGE_TOKEN);

    return fetch("https://graph.facebook.com/me/messages?" + qs, {
        method: "POST", 
        headers: {"Content-Type": "application/json"},
        body
    })
    .then(resp => resp.json())
    .then(json => {
        if(json.error && json.error.message){
            throw new Error(json.error.message);  
        }
        return json;
    });
};


// Wit.ai code
const sessions = {}
const findOrCreateSession = fbid => {
    let sessId;
    Object.keys(sessions).forEach(k => {
        if(sessions[k].fbid === fbid){
            sessId = k;
        }
    });
    if(!sessId){
        sessId = new Date().toISOString();
        sessions[sessId] = {fbid: fbid, context: {}};
    }
    return sessId;
};

const wit = new Wit({accessToken: WIT_TOKEN, logger: new log.Logger(log.INFO)});

const app = express();

app.use(({method, url}, resp, next) => {
    resp.on('finish', () => {
        console.log(`${resp.statusCode} ${method} ${url}`);
    });
    next();
});

app.use(bodyParser.json({verify: verifyReqSignature}));

app.get("/webhook", (req, res) => {
    if(req.query["hub.mode"] === "subscribe" && req.query["hub.verify_token"] === process.env.FB_VERIFY_TOKEN){
        res.send(req.query["hub.challenge"]);
    } else{
        res.sendStatus(400);
    }
});

// Message Handler
app.post("/webhook", (req, res) => {
    const data = req.body;
  
    if(data.object === "page"){
      data.entry.forEach(entry => {
        entry.messaging.forEach(event => {
          if(event.message && !event.message.is_echo){
            const sender = event.sender.id;
            const {text, attachments} = event.message;
  
            if(attachments){
              fbMessage(
                sender,
                "Sorry I can only process text messages for now."
              ).catch(console.error);
            } else if (text) {
              wit
                .message(text)
                .then(res => handler.responseFromWit(res))
                .then(msg => {
                  fbMessage(sender, msg);
                })
                .catch(err => {
                  console.error(
                    "Oops! Got an error from Wit: ",
                    err.stack || err
                  );
                });
            }
          } else {
            console.log("received event", JSON.stringify(event));
          }
        });
      });
    }
    res.sendStatus(200);
  });


  function verifyReqSignature(req, res, buf) {
    var signature = req.headers["x-hub-signature"];
    console.log(signature);
  
    if (!signature) {
      console.error("Couldn't validate the signature.");
    } else {
      var elements = signature.split("=");
      var method = elements[0];
      var signatureHash = elements[1];
  
      var expectedHash = crypto
        .createHmac("sha1", FB_APP_SECRET)
        .update(buf)
        .digest("hex");
  
      if (signatureHash != expectedHash) {
        throw new Error("Couldn't validate the request signature.");
      }
    }
  }
  
  app.listen(PORT);
  console.log("Listening on :" + PORT + "...");
