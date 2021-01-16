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

let data = {};

const config = {
    GCP_API_KEY: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GCP_CX: process.env.GOOGLE_APPLICATION_CX
}

function analyzeSearchResults() {
    //TODO
    console.log(data);
}

async function getResult(req) {
    var goodHits = 0;
    var startNum = 1;
    const query = req.body.q;

    for(i = 0; i < 10; i++) {
        await getData(query, startNum);
        goodHits += analyzeSearchResults();
        startNum += 10;
    }
    // DO CALCULATIONS HERE
    //console.log(goodHits);
}

async function getData(query, begin) {
    //console.log(query);
    const q = query;
    const start = begin;
    const num = 10;
    console.log(q, start, num);

    try {

        await customsearch.cse.list({
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

        data = {
            q,
            totalResults: page.totalResults,
            count: page.count,
            startIndex: page.startIndex,
            nextPage: nextPage.startIndex,
            previousPage: previousPage.startIndex,
            time: searchInformation.searchTime,
            items: items.map(o => ({
            sitename: o.pagemap.metatags[0]["og:site_name"],
            twitter_name: o.pagemap.metatags[0]["twitter:app:name:googleplay"],
            }))
        }
        })
    } catch (err) {
        console.log(err);
    }
    // console.log(data);
}

//endpoints

app.post('/postText', async (req, res) => {
    console.log(req.body);

    try {
        res.status(200).send(getResult(req));
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }

});


// ----------------------------------------------------------------------------------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));