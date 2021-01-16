require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
const fs = require('fs');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const customsearch = google.customsearch('v1');

const config = {
    GCP_API_KEY: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GCP_CX: process.env.GOOGLE_APPLICATION_CX
}

async function analyzeSearchResults() {
    //TODO
}

//endpoints

app.post('/postText', async (req, res) => {
    console.log(req.body);

    const q = req.body.q;
    const start = req.body.start;
    const num = req.body.num;

    console.log(q, start, num);

    try {
        customsearch.cse.list({
            auth: config.GCP_API_KEY,
            cx: config.GCP_CX,
            q, start, num
        })

        .then(result => result.data)
        .then((result) => {
        const { queries, items, searchInformation } = result;

        const page = (queries.request || [])[0] || {};
        const previousPage = (queries.previousPage || [])[0] || {};
        const nextPage = (queries.nextPage || [])[0] || {};

        const data = {
            q,
            totalResults: page.totalResults,
            count: page.count,
            startIndex: page.startIndex,
            nextPage: nextPage.startIndex,
            previousPage: previousPage.startIndex,
            time: searchInformation.searchTime,
            items: items.map(o => ({
            sitename: o.pagemap.metatags[0]["og:site_name"],
            title: o.title,
            snippet: o.snippet,
            img: (((o.pagemap || {}).cse_image || {})[0] || {}).src
            }))
        }
        // res.status(200).send(result);
        res.status(200).send(data);
        })

    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }

});


// ----------------------------------------------------------------------------------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));