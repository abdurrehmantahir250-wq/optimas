const express = require('express');
const multer = require('multer');
const {
    browseVirtualFolder,
    listVirtualFolders,
    listTrashItems,
    createVirtualFolder,
    uploadVirtualFile,
    renameVirtualFile,
    moveVirtualFile,
    shareVirtualFile,
    deleteVirtualFolder,
    deleteVirtualFile,
    restoreVirtualFile,
    purgeVirtualFile,
    serviceErrorResponse
} = require('../services/virtualFileService');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

router.get('/trash', async (req, res) => {
    try {
        const payload = await listTrashItems(req);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Failed to load trash.');
        return res.status(err.status).json({ ...err, items: [] });
    }
});

router.get('/browse', async (req, res) => {
    try {
        const payload = await browseVirtualFolder(req);
        return res.status(200).json(payload);
    } catch (error) {
        console.error('[VIRTUAL-FILES] Browse failed:', error.message);
        const err = serviceErrorResponse(error, 'Failed to browse virtual folder.');
        return res.status(err.status).json({ ...err, items: [] });
    }
});

router.get('/folders', async (req, res) => {
    try {
        const payload = await listVirtualFolders(req);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Failed to list folders.');
        return res.status(err.status).json({
            ...err,
            folders: [{ label: 'Cloud Drive (root)', value: '/' }]
        });
    }
});

router.get('/list', async (req, res) => {
    try {
        const payload = await browseVirtualFolder(req);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Failed to list virtual folder.');
        return res.status(err.status).json({ ...err, items: [] });
    }
});

router.post('/folders', async (req, res) => {
    try {
        const payload = await createVirtualFolder(req.body || {});
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Could not create folder.');
        return res.status(err.status).json(err);
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        const payload = await uploadVirtualFile(req, req.file);
        return res.status(200).json(payload);
    } catch (error) {
        console.error('[VIRTUAL-FILES] Upload failed:', error.message);
        const err = serviceErrorResponse(error, 'Virtual file upload failed.');
        return res.status(err.status).json(err);
    }
});

router.patch('/:id/rename', async (req, res) => {
    try {
        const payload = await renameVirtualFile(req, req.params.id, req.body || {});
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Rename failed.');
        return res.status(err.status).json(err);
    }
});

router.patch('/:id/move', async (req, res) => {
    try {
        const payload = await moveVirtualFile(req, req.params.id, req.body || {});
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Move failed.');
        return res.status(err.status).json(err);
    }
});

router.post('/:id/share', async (req, res) => {
    try {
        const payload = await shareVirtualFile(req, req.params.id);
        return res.status(200).json(payload);
    } catch (error) {
        console.error('[VIRTUAL-FILES] Share failed:', error.message);
        const err = serviceErrorResponse(error, 'Could not create share link.');
        return res.status(err.status).json(err);
    }
});

router.delete('/folders/:id', async (req, res) => {
    try {
        const payload = await deleteVirtualFolder(req.params.id);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Delete folder failed.');
        return res.status(err.status).json(err);
    }
});

router.post('/:id/restore', async (req, res) => {
    try {
        const payload = await restoreVirtualFile(req, req.params.id);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Restore failed.');
        return res.status(err.status).json(err);
    }
});

router.delete('/:id/permanent', async (req, res) => {
    try {
        const payload = await purgeVirtualFile(req.params.id);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Permanent delete failed.');
        return res.status(err.status).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const payload = await deleteVirtualFile(req.params.id);
        return res.status(200).json(payload);
    } catch (error) {
        const err = serviceErrorResponse(error, 'Delete failed.');
        return res.status(err.status).json(err);
    }
});

module.exports = router;
