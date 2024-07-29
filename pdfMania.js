require('dotenv').config()
const fs = require('fs');
const https = require('https');
const path = require('path');
const uploadFile = require('./firebaseupload');
const axios = require('axios');
const apiKey = process.env.PDF_API_KEY; // Replace with your actual API key
const convertToPdf = async (input,output) => {
  const ext = path.extname(input).toLowerCase();
  console.log(ext);
  if(ext === '.doc' || ext === '.docx') {
    uploadFile(input,`file/${input}`).then(res => {
      axios.post('https://api.pdf.co/v1/pdf/convert/from/doc',{
        url : res,
        name : output,
        async : false
      }, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }}).then(res => {
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
          // });
          return res;
      }).catch(err => console.log('error'));
    })
  }
  else if(ext === '.jpg' || ext === '.png' || ext === '.tiff') {
    uploadFile(inputfile,destination).then(res => {
      axios.post('https://api.pdf.co/v1/pdf/convert/from/image',{
        url : res,
        name : output,
        async : false
      }, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        }}).then(res => {
          filePath = `./${output}`
          const file = fs.createWriteStream(filePath);
          console.log(res,filePath,res.data.url);
          https.get(res.data.url, (response) => {
              response.pipe(file);
              file.on('finish', () => {
                  file.close();
                  console.log('Download completed');
              });
          }).on('error', (err) => {
              fs.unlink(filePath, () => {}); // Delete the file asynchronously if there's an error
              console.error('Error downloading the file:', err.message);
          });
      }).catch(err => console.log('error'));
    })
  }
  else {
    console.log('Unsupported file format');
  }
}



module.exports = { convertToPdf }