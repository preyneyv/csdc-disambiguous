require("dotenv").config()

import express from 'express'
import bodyParser from 'body-parser'

import db from './db.js'

db.setDebug(false)

const app = express(),
	port = process.env.PORT || 8002

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/static'))
app.use('/patches', express.static(process.env.PATCHES_DIR))

app.use((req, res, next) => {
	req.post = req.body
	req.get = req.query
	next()
})

app.post('/api/resolve', async (req, res) => {
	let { text, patch_id } = req.post
	if (!(text && patch_id))
		res.status(400).send({success: false})
	try {
		await db.resolve(text, patch_id)
		res.send({success: true})
	} catch(e) {
		res.status(500).send({success: false})
	}
});

app.get('/api/next', async (req, res) => {
	try {
		const results = await db.next()
		if (results.length == 0) {
			// out of images
			return res.send({success: false, error: "NO_MORE_IMAGES"})
		}
		const image = {
			patch_id: results[0].patch_id,
			path: results[0].path,
			labels: results.map(r => r.text)
		}
		res.send({
			success: true,
			image
		})
	} catch(e) {
		res.status(500).send({success: false})
	}
});

app.listen(port)
console.log(`You can resolve ambiguities at http://localhost:${port}`)