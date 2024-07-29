// Import required modules
require('dotenv').config()
const express = require('express');

// Create an Express application
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {uploadFile, deleteFile} = require('./firebaseupload');
const apiKey = process.env.PDF_API_KEY; 
const axios = require('axios'); 
console.log(apiKey);
const randomStringGen = () => {
  const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += s[Math.floor(Math.random() * s.length)];
  }
  return result;
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Uploads folder where files will be stored
    },
    // filename: function (req, file, cb) {
    //   cb(null, file.originalname); // Keep the original file name
    // }
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + randomStringGen() + path.extname(file.originalname));
    }
  });
  
const upload = multer({ storage: storage });
 
app.use(express.json());

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Define a route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});


app.post('/convert',upload.single('file'),async (req,res) => {
  if (!req.file) {
      return res.status(400).send('No files were uploaded.');
  }
  console.log(req.file);
    // If file upload is successful, you can send a response
  const filename = req.file.path;
  const ext = path.extname(req.file.filename).toLowerCase();
  console.log(ext);
  if(ext === '.doc' || ext === '.docx') {
    uploadFile(filename,`file/${req.file.filename}`).then(result => {
      console.log('result',result);
      axios.post('https://api.pdf.co/v1/pdf/convert/from/doc',{
        url : result,
        name : req.file.filename,
        async : false
      }, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }}).then(async (out) => {
          console.log('output', out.data.url);
          // filePath = output
          // const file = fs.createWriteStream(filePath);
          // console.log(res,filePath,res.data.url);
          // https.get(res.data.url, (response) => {
          //     response.pipe(file);
          //     file.on('finish', () => {
          //         file.close();
          //         console.log('Download completed');
          //     });
          // }).on('error', (err) => {
          //     fs.unlink(filePath, () => {}); // Delete the file asynchronously if there's an error
          //     console.error('Error downloading the file:', err.message);
            res.send(out.data.url).status(200)
            await deleteFile(`file/${req.file.filename}`);
            fs.unlinkSync(req.file.path)
            // fs.unlinkSync(`uploads/${req.file.filename}`)
          });
      }).catch(err => console.log('error\n\n',err));
    }
  else if(ext === '.jpg' || ext === '.png' || ext === '.tiff') {
    uploadFile(filename,`file/${req.file.filename}`).then(result => {
      axios.post('https://api.pdf.co/v1/pdf/convert/from/image',{
        url : result,
        name : req.file.filename,
        async : false
      }, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }}).then(async (out) => {
      //     filePath = `./${output}`
      //     const file = fs.createWriteStream(filePath);
      //     console.log(res,filePath,res.data.url);
      //     https.get(res.data.url, (response) => {
      //         response.pipe(file);
      //         file.on('finish', () => {
      //             file.close();
      //             console.log('Download completed');
      //         });
      //     }).on('error', (err) => {
      //         fs.unlink(filePath, () => {}); // Delete the file asynchronously if there's an error
      //         console.error('Error downloading the file:', err.message);
              res.send(out.data.url)
              await deleteFile(`file/${req.file.filename}`);
              fs.unlinkSync(req.file.path)
          });
      }).catch(err => console.log('error',err));
  }
  else {
    console.log('Unsupported file format');
  }
})
app.post('/delete',async (req, res) => {
  try{
    console.log(req.body);
    res.status(200).send('File deleted successfully');
  }
  catch(error){
    console.error('Error deleting file:', error);
    res.status(500).send('Error deleting file');
  }
})


app.post('/merge', upload.array('files',100),async (req, res) => {
  if(!req.files) {
    console.log('Error uploading files');
  }
  // req.files.map(file => upload)
  console.log(req.files);
  let filepromises = req.files.map(file => uploadFile(file.path,`file/${file.filename}`))
  const result = await Promise.all(filepromises)
  var url  = '';
  result.forEach(item => {
    url += item + ',';
  })
  url = url.substr(0, url.length-1);
  axios.post('https://api.pdf.co/v1/pdf/merge2',{
    url,
    async : false
  }, 
  {
    headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  }}).then(out => {
    res.send(out.data.url)
    req.files.forEach(file => {
      deleteFile(`file/${file.filename}`)
      fs.unlinkSync(file.path)
    })
  }).catch(err => console.log('Error Found : ',err));
})
// Start the server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
