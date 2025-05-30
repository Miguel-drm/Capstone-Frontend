const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

// POST /api/extract-text
// Body: { fileUrl: string, fileType: string }
router.post('/', async (req, res) => {
  const { fileUrl, fileType, gridFsId } = req.body;
  if ((!fileUrl && !gridFsId) || !fileType) {
    return res.status(400).json({ message: 'fileUrl or gridFsId and fileType are required' });
  }
  let finished = false; // Prevent multiple responses
  try {
    if (fileType === 'application/pdf' && gridFsId) {
      // Extract PDF from GridFS using a promise-based approach
      const db = mongoose.connection.db;
      const bucket = new GridFSBucket(db, { bucketName: 'storyFiles' });
      try {
        const buffer = await new Promise((resolve, reject) => {
          const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(gridFsId));
          let chunks = [];
          downloadStream.on('data', (chunk) => chunks.push(chunk));
          downloadStream.on('error', (err) => reject(err));
          downloadStream.on('end', () => resolve(Buffer.concat(chunks)));
        });
        // Basic PDF validation: check for %PDF header
        if (!buffer || buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
          throw new Error('Invalid PDF file (missing %PDF header)');
        }
        const data = await pdfParse(buffer);
        return res.json({ text: data.text });
      } catch (error) {
        console.error('Error extracting text from GridFS PDF:', error);
        return res.status(500).json({ message: 'Failed to extract text from PDF in GridFS', error: error.message });
      }
    }
    // fileUrl is expected to be relative to uploads, e.g. 'myfile.pdf' or 'subdir/myfile.pdf'
    const uploadsDir = path.join(__dirname, '../uploads');
    // Remove any leading slashes from fileUrl
    const safeFileUrl = fileUrl.replace(/^\/+/, '');
    const filePath = path.join(uploadsDir, safeFileUrl);
    console.log('[extractText] fileUrl:', fileUrl, '| filePath:', filePath, '| fileType:', fileType);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found', filePath });
    }
    if (fileType === 'application/pdf') {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        // Use pdf-parse to extract text from PDF
        const data = await pdfParse(dataBuffer);
        return res.json({ text: data.text });
      } catch (error) {
        console.error('Error extracting text from PDF file:', error);
        return res.status(500).json({ message: 'Failed to extract text from PDF file', error: error.message });
      }
    } else if (
      fileType === 'application/msword' ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      try {
        const data = await mammoth.extractRawText({ path: filePath });
        return res.json({ text: data.value });
      } catch (error) {
        console.error('Error extracting text from Word file:', error);
        return res.status(500).json({ message: 'Failed to extract text from Word file', error: error.message });
      }
    } else {
      try {
        // Assume plain text
        const text = fs.readFileSync(filePath, 'utf8');
        return res.json({ text });
      } catch (error) {
        console.error('Error reading plain text file:', error);
        return res.status(500).json({ message: 'Failed to read plain text file', error: error.message });
      }
    }
  } catch (error) {
    console.error('Error extracting text:', error, '| fileUrl:', req.body.fileUrl, '| filePath:', filePath);
    res.status(500).json({ message: 'Failed to extract text', error: error.message, fileUrl, filePath });
  }
});

module.exports = router;
