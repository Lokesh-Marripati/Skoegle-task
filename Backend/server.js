const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');
require('dotenv').config(); // Environment Variables Setup

const app = express();
app.use(cors());
app.use(express.json());

// AWS S3 Setup
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// Firebase Admin Setup
const serviceAccount = require('./config/service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // Example: "skoegle-iot.appspot.com"
});

const bucket = admin.storage().bucket();

// Multer Setup
const upload = multer({ storage: multer.memoryStorage() });

// Upload Video to AWS S3
app.post('/api/upload', upload.single('video'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    const fileName = req.file.originalname;
    const file = req.file;

    // Validate file name format
    const fileNamePattern = /^\d{14}-\d{14}\.mp4$/;
    if (!fileNamePattern.test(fileName)) {
        return res.status(400).send({ message: 'Invalid file name format. Use format DDMMYYYYHHMMSS-DDMMYYYYHHMMSS.mp4' });
    }

    // Upload to AWS S3
    const s3Params = {
        Bucket: process.env.AWS_BUCKET_NAME, // Ensure your .env file has AWS_BUCKET_NAME
        Key: `videos/${fileName}`, // Store files in a "videos" folder in the S3 bucket
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    try {
        const s3Response = await s3.upload(s3Params).promise();
        res.status(200).send({ message: 'Uploaded successfully to AWS', url: s3Response.Location });
    } catch (error) {
        console.error('AWS S3 Upload Error:', error);
        res.status(500).send({ message: 'Failed to upload to AWS S3' });
    }
});

// Get List of Videos from AWS S3
app.get('/api/videos', async (req, res) => {
    try {
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
        };

        const s3Response = await s3.listObjectsV2(params).promise();
        const videos = s3Response.Contents.map((file) => ({
            name: file.Key,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
        }));

        res.status(200).send({ videos });
    } catch (error) {
        console.error('AWS S3 Fetch Error:', error);
        res.status(500).send({ message: 'Failed to fetch videos from AWS S3' });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
