'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser')
const cors = require('cors');
const dns = require('dns');

const app = express();
const db = mongoose.connection;
const Schema = mongoose.Schema

// Basic Configuration 
const port = process.env.PORT || 3000;
/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI, { useMongoClient: true });

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log('DB CONNECTED!')
});

let urlSchema = new Schema({
  original_url: String,
  short_url: Number
})

urlSchema.methods.whatSaved = function () {
  let url = this.original_url ? { original_url: this.original_url, short_url: this.short_url } : "Not saved anyone";
}

let urlModel = mongoose.model('urlModel', urlSchema)

///////////////////////////////

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const urlAsk = (req, res) => {
  let reqUrl = req.body.url
  /* const filteredUrl = reqUrl.replace(/^https?:\/\//,'');

  dns.lookup(filteredUrl, err => {
      if (err) res.json({error: 'Invalid Hostname'})
  }); */
  
  urlModel.findOne({original_url: reqUrl}, (err, data) => {
    
      if (err) res.json(err)
    
      else {

        if (data) res.json({url: data.original_url,shortUrl: data.short_url})
        
        else {
          
          let newShortUrl
          
          
          urlModel.find(function (err, urls) {
            if (err) res.json({error: 'DB connection error!'})
            newShortUrl = urls[urls.length - 1].short_url + 1
          })
          .then(() => {
            const doc = new urlModel({original_url: reqUrl, short_url: newShortUrl})
            doc.save()
            res.json({url: doc.original_url, shortUrl: doc.short_url})
          })
        } 
      }
    })
  
}

app.post("/api/shorturl/new", (req, res) => {
  urlAsk(req, res)
})






function redirectUnmatched(req, res) {
  const invalidUrl = {
    error: "invalid url"
  }
  res.json(invalidUrl);
}

app.use(redirectUnmatched)



app.listen(port, function () {
  console.log('Node.js listening ...');
});

