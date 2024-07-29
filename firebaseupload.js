require('dotenv').config();
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const path = require('path');
// Initialize Firebase
// const serviceAccount = require('./pdfManiaConfig.json')
const serviceAccount = require('./config')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});
// console.log(serviceAccount.private_key,type?of(serviceAccount));
const bucket = getStorage().bucket();

async function uploadFile(localFilePath, destination) {
  try {
    const options = {
      destination: destination,
    };
    
    // Upload the file to Firebase Storage
    await bucket.upload(localFilePath, options);
    
    // Make the file public
    const file = bucket.file(destination);
    await file.makePublic();
    
    const publicUrl = `${process.env.FIREBASE_URL}/${bucket.name}/${destination}`;
    console.log(`${localFilePath} uploaded to ${destination}`);
    console.log(`Public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
  }
}

async function deleteFile(url) {
  try {
    bucket.file(url).delete().then(() => {
      console.log('Deleted Successfully')
    }).catch(err => console.log(err))
  }
  catch (error) {
    console.error('Error deleting file:', error);
  }
}

module.exports = {uploadFile , deleteFile};
