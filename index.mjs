import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs/promises';

import { jsonToString, scriptToTreatment } from './tools.mjs'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express();
const port = process.env.PORT || 3002;
const scriptFilePath = path.join(__dirname, 'public', 'script.json');
const treatmentFilePath = path.join(__dirname, 'public', 'treatment.txt');

const upload = multer({storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')))

app.post('/run', async (req, res) => {
    let scriptJson;
    let treatmentText;

    try {
        scriptJson = jsonToString(JSON.parse(await fs.readFile(scriptFilePath)));
        treatmentText = await fs.readFile(treatmentFilePath);
    } catch (error) {
        return res.status(500).json({ error: error.message })
    }


    const stream = await scriptToTreatment(scriptJson, { role:'user', content: `EXAMPLE(s): ${treatmentText}` })

    for await (const chunk of stream) {
        const delta = (chunk.choices[0]?.delta?.content || "").replace(/\*/g, '')

        res.write(delta);
    }


    return res.end()
})

app.post('/upload/json', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No files were uploaded.'});
    }
    const file = req.file.buffer;

    await fs.writeFile(scriptFilePath, file);
    res.json({ status: 200 })
})

app.post('/upload/txt', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({error: 'No files were uploaded.'});
    }
    const file = req.file.buffer;

    await fs.writeFile(treatmentFilePath, file);
    res.json({ status: 200 })
})


app.listen(port, 'localhost', () => { console.log(`http://localhost:${port}`); });