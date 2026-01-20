const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

app.use('/uploads', express.static(uploadDir, { maxAge: '1d' }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const upload = multer({ storage: storage });

mongoose.connect('mongodb://127.0.0.1:27017/jarchive')
  .then(() => console.log('MongoDB Connected'));

// --- SCHEMAS ---

const VersionSchema = new mongoose.Schema({
  filename: String,
  uploadDate: { type: Date, default: Date.now },
  size: String,
  sizeBytes: Number,
  versionNumber: Number
});

const AssetSchema = new mongoose.Schema({
  name: String,
  category: String,
  description: String,
  filename: String,
  originalName: String,
  size: String,
  sizeBytes: Number,
  uploadDate: { type: Date, default: Date.now },
  versions: [VersionSchema] 
});
const Asset = mongoose.model('Asset', AssetSchema);

const RequestSchema = new mongoose.Schema({
  type: String, 
  status: { type: String, default: 'pending' },
  studentMessage: String,
  tempName: String,
  tempCategory: String,
  tempDescription: String,
  tempFilename: String,
  tempSize: String,
  tempSizeBytes: Number,
  tempOriginalName: String,
  targetAssetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  date: { type: Date, default: Date.now }
});
const Request = mongoose.model('Request', RequestSchema);

const LogSchema = new mongoose.Schema({
  action: String,
  detail: String,
  date: { type: Date, default: Date.now }
});
const Log = mongoose.model('Log', LogSchema);

function formatBytes(bytes) {
  if (!+bytes) return '0 Bytes';
  const k = 1024, i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${['Bytes', 'KB', 'MB', 'GB'][i]}`;
}

// --- ROUTES: VIDEO STREAMING ---
app.get('/stream/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = { 'Content-Length': fileSize, 'Content-Type': 'video/mp4' };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// --- ROUTES: AUTH ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'guru' && password === 'admin123') return res.json({ role: 'admin' });
  if (username === 'siswa' && password === 'jarchive') return res.json({ role: 'student' });
  res.status(401).json({ error: 'Invalid credentials' });
});

// --- ROUTES: ASSETS ---
app.get('/api/assets', async (req, res) => {
  try {
    const { category, sort, page = 1, limit = 8, search } = req.query;
    let query = {};
    
    if (category && category !== 'All') query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    let sortOption = { uploadDate: -1 };
    if (sort === 'oldest') sortOption = { uploadDate: 1 };
    if (sort === 'az') sortOption = { name: 1 };

    const assets = await Asset.find(query).sort(sortOption).limit(limit * 1).skip((page - 1) * limit);
    const count = await Asset.countDocuments(query);

    res.json({ assets, totalPages: Math.ceil(count / limit), currentPage: page });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const asset = new Asset({
      name: req.body.name,
      category: req.body.category,
      description: req.body.description,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: formatBytes(req.file.size),
      sizeBytes: req.file.size,
      versions: []
    });
    await asset.save();
    await Log.create({ action: 'upload', detail: `Admin upload: ${asset.name}` });
    res.json(asset);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// UPDATE ASSET (METADATA + OPTIONAL FILE REPLACE)
app.put('/api/assets/:id', upload.single('file'), async (req, res) => {
    try {
        const { name, description, category } = req.body;
        const asset = await Asset.findById(req.params.id);
        if (!asset) return res.status(404).json({ error: 'Asset not found' });

        let updateData = { name, description, category };
        let pushData = {};

        // Jika ada file baru yang diupload saat edit
        if (req.file) {
             // 1. Arsipkan file lama ke versions
             pushData = {
                versions: {
                    filename: asset.filename,
                    size: asset.size,
                    sizeBytes: asset.sizeBytes,
                    uploadDate: asset.uploadDate,
                    versionNumber: asset.versions.length + 1
                }
             };

             // 2. Update data utama dengan file baru
             updateData.filename = req.file.filename;
             updateData.originalName = req.file.originalname;
             updateData.size = formatBytes(req.file.size);
             updateData.sizeBytes = req.file.size;
             updateData.uploadDate = Date.now();
        }

        // Lakukan update atomik
        const updateOperation = { $set: updateData };
        if (req.file) {
            updateOperation.$push = pushData;
        }

        await Asset.findByIdAndUpdate(req.params.id, updateOperation);
        
        await Log.create({ action: 'update', detail: `Admin updated: ${name} ${req.file ? '(File Replaced)' : ''}` });
        res.json({ message: 'Updated successfully' });
    } catch(err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/assets/:id', async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (asset) {
    if(fs.existsSync(path.join(uploadDir, asset.filename))) fs.unlinkSync(path.join(uploadDir, asset.filename));
    if(asset.versions) {
        asset.versions.forEach(v => {
            if(fs.existsSync(path.join(uploadDir, v.filename))) fs.unlinkSync(path.join(uploadDir, v.filename));
        });
    }
    await Log.create({ action: 'delete', detail: `Admin delete: ${asset.name}` });
  }
  await Asset.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

app.get('/download/:filename', async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    const asset = await Asset.findOne({ filename: req.params.filename }) || await Asset.findOne({ "versions.filename": req.params.filename });
    const assetName = asset ? asset.name : req.params.filename;
    
    await Log.create({ action: 'download', detail: `Downloaded: ${assetName}` });
    res.download(filePath);
  } else {
    res.status(404).send('File not found');
  }
});

// --- ROUTES: REQUESTS ---
app.post('/api/requests', upload.single('file'), async (req, res) => {
  try {
    const { type, message, name, category, description, targetAssetId } = req.body;
    
    const newReq = new Request({
      type,
      studentMessage: message,
      targetAssetId: targetAssetId || null,
      tempName: name || null,
      tempCategory: category || 'Docs',
      tempDescription: description || null,
      tempFilename: req.file ? req.file.filename : null,
      tempOriginalName: req.file ? req.file.originalname : null,
      tempSize: req.file ? formatBytes(req.file.size) : null,
      tempSizeBytes: req.file ? req.file.size : 0
    });
    await newReq.save();
    res.json({ message: 'Request sent' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/requests', async (req, res) => {
  const requests = await Request.find().sort({ date: -1 }).populate('targetAssetId');
  res.json(requests);
});

app.delete('/api/requests', async (req, res) => {
    try {
        const pendingRequests = await Request.find({ status: 'pending' });
        pendingRequests.forEach(reqData => {
            if (reqData.tempFilename && fs.existsSync(path.join(uploadDir, reqData.tempFilename))) {
                fs.unlinkSync(path.join(uploadDir, reqData.tempFilename));
            }
        });
        await Request.deleteMany({});
        await Log.create({ action: 'reset', detail: 'Admin cleared all requests' });
        res.json({ message: 'All requests cleared' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requests/:id/approve', async (req, res) => {
  try {
    const reqData = await Request.findById(req.params.id);
    if (!reqData) return res.status(404).json({ error: 'Not found' });

    if (reqData.type === 'upload') {
        const newAsset = new Asset({
            name: reqData.tempName, 
            category: reqData.tempCategory, 
            description: reqData.tempDescription,
            filename: reqData.tempFilename, 
            originalName: reqData.tempOriginalName, 
            size: reqData.tempSize,
            sizeBytes: reqData.tempSizeBytes
        });
        await newAsset.save();
        await Log.create({ action: 'approve', detail: `Approved New Upload: ${newAsset.name}` });

    } else if (reqData.type === 'update') {
      const oldAsset = await Asset.findById(reqData.targetAssetId);
      if(oldAsset) {
        if (reqData.tempFilename) {
            await Asset.findByIdAndUpdate(reqData.targetAssetId, { 
                $push: { versions: { 
                    filename: oldAsset.filename, 
                    size: oldAsset.size, 
                    sizeBytes: oldAsset.sizeBytes,
                    uploadDate: oldAsset.uploadDate, 
                    versionNumber: oldAsset.versions.length + 1 
                }} 
            });
        }

        const updates = {
          name: reqData.tempName || oldAsset.name,
          description: reqData.tempDescription || oldAsset.description,
          category: reqData.tempCategory || oldAsset.category,
          uploadDate: Date.now()
        };

        if (reqData.tempFilename) {
          updates.filename = reqData.tempFilename;
          updates.originalName = reqData.tempOriginalName;
          updates.size = reqData.tempSize;
          updates.sizeBytes = reqData.tempSizeBytes;
        }

        await Asset.findByIdAndUpdate(reqData.targetAssetId, updates);
        await Log.create({ action: 'approve', detail: `Approved Update: ${updates.name}` });
      }
    }
    reqData.status = 'approved';
    await reqData.save();
    res.json({ message: 'Approved' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requests/:id/reject', async (req, res) => {
    const reqData = await Request.findById(req.params.id);
    if (reqData.tempFilename && fs.existsSync(path.join(uploadDir, reqData.tempFilename))) {
        fs.unlinkSync(path.join(uploadDir, reqData.tempFilename));
    }
    reqData.status = 'rejected';
    await reqData.save();
    res.json({ message: 'Rejected' });
});

// --- ROUTES: LOGS ---
app.get('/api/logs', async (req, res) => {
  const logs = await Log.find().sort({ date: -1 }).limit(50);
  res.json(logs);
});

app.delete('/api/logs', async (req, res) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'All logs cleared' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(5000, '0.0.0.0', () => console.log('Server Ready on port 5000'));