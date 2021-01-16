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
let hits = {value: -1};

const sources = ["CNN", "NYTimes", "AP NEWS" , "Washington Post", "BBC News", "CBC", "Snopes.com"];

const config = {
    GCP_API_KEY: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    GCP_CX: process.env.GOOGLE_APPLICATION_CX
}

function searchSources(sitename, twitter_name) {
    for(s of sources) {
        if (sitename != null && sitename.includes(s)) {
            return true;
        }
        if (twitter_name != null && twitter_name.includes(s)) {
            return true;
        }
    }
    return false;
}

function analyzeSearchResults() {
    //TODO
    var goodHits = 0;
    for(v of data.items){
        if (searchSources(v.sitename, v.twitter_name)) {
            goodHits++;
        }
    }
    return goodHits;
}

async function getResult(req) {
    var goodHits = 0;
    var startNum = 1;
    const query = req.body.q;
    const numArticles = 100;

    for(i = 0; i < 10; i++) {
        await getData(query, startNum);
        //console.log(data);
        goodHits += analyzeSearchResults();
        startNum += 10;
    }
    // DO CALCULATIONS HERE
    console.log(goodHits);
    var percentage = goodHits/numArticles;
    if (percentage <= 0.2) {
        hits.value = 0;
    } else if (percentage <= 0.4) {
        hits.value = 1;
    } else if (percentage <= 0.6) {
        hits.value = 2;
    } else if (percentage <= 0.8) {
        hits.value = 3;
    } else {
        hits.value = 4;
    }
    console.log(hits.value);
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
            snippet: o.snippet,
            }))
        }
        })
    } catch (err) {
        data = {};
        console.log(err);
    }
    // console.log(data);
}

//endpoints

app.post('/postText', async (req, res) => {
    console.log(req.body);

    try {
        await getResult(req);
        res.status(200).send(hits);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }

});


// ----------------------------------------------------------------------------------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));