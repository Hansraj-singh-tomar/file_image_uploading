const express = require("express");
const mongodb = require("mongodb");
const multer = require("multer");

const path = require('path');
const fs = require('fs');

const app = express();

app.use(express()); 

// Now these two lines for get data from input fields.
app.use(express.json());
app.use(express.urlencoded({extended:true}));

var storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,"uploads");
    },
    filename:function(req,file,cb){
        cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
})

var upload = multer({
    storage:storage
})

// configuring mongodb

const MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017';

MongoClient.connect(url,{
    useUnifiedTopology:true,
    useNewUrlParser:true
}, (err,client) => {
    if(err) return console.log(err);

    db = client.db('Images');

    app.listen(3000,()=>{
        console.log('Mongo DB server listening at 3000');
    })
});

// configuring the home routes
app.get('/', (req,res) => {
    res.sendFile(__dirname + "/index.html") //! static file index.html ko render karvane ke liye ham sendFile ka use kar rhe hai 
});


// configuring the upload file route

app.post('/uploadFile', upload.single('myFile'),(req,res,next) => {
    const file = req.file;
    // console.log(file);
        /*
            {
                fieldname: 'myFile',
                originalname: '70783.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                destination: 'uploads',
                filename: 'myFile-1653539150527.jpg',
                path: 'uploads\\myFile-1653539150527.jpg',
                size: 68509
            }
        */

    if(!file){
        const error = new Error("please upload a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(file);
})

// configure the multiple files 

app.post("/uploadmultiple",upload.array('myFiles',12), (req,res,next) => {  //! 12 means ham ek sath sirf 12 hi file send kar sakte hai 
    const files = req.files;
    // console.log(files);
    /*
    [
        {
            fieldname: 'myFiles',
            originalname: '70783.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: 'uploads',
            filename: 'myFiles-1653543197089.jpg',
            path: 'uploads\\myFiles-1653543197089.jpg',
            size: 68509
        },
        {
            fieldname: 'myFiles',
            originalname: '481965.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: 'uploads',
            filename: 'myFiles-1653543197102.jpg',
            path: 'uploads\\myFiles-1653543197102.jpg',
            size: 1164530
        },
        {
            fieldname: 'myFiles',
            originalname: '234864.jpg',
            encoding: '7bit',
            mimetype: 'image/jpeg',
            destination: 'uploads',
            filename: 'myFiles-1653543197161.jpg',
            path: 'uploads\\myFiles-1653543197161.jpg',
            size: 481546
        }
    ]
    */

    if(!files){
        const error = new Error("please upload a file");
        error.httpStatusCode = 400;
        return next(error);
    }
    res.send(files);
})

// configuring the images upload to the database

app.post("/uploadphoto", upload.single("myImage"), (req,res,next) => {
    var img = fs.readFileSync(req.file.path);
    // console.log(img);  // <Buffer ff d8 ff e1 15 ca 45 78 69 66 00 00 4d 4d 00 2a 00 00 00 08 00 07 01 12 00 03 00 00 00 01 00 01 00 00 01 1a 00 05 00 00 00 01 00 00 00 62 01 1b 00 05 ... 1164480 more bytes>

    var encode_image = img.toString('base64');

    // define a JSON object for the image
    
    var finalImg = {
        contentType: req.file.mimetype,
        path:req.file.path,
        image:new Buffer(encode_image,'base64')
    };

    // insert the image to the database
    db.collection('image').insertOne(finalImg, (err,result) => {
        // console.log(result);   // { acknowledged: true, insertedId: new ObjectId("628f0f9bce699a415eaadd04") }

        if(err) return console.log(err);

        console.log("save to database");

        res.contentType(finalImg.contentType);

        res.send(finalImg.image);
    })
 
})
 


app.listen(5000, () => {
    console.log('server is listening at the port 5000');
});