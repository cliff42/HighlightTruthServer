require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const cors = require('cors');
//const fs = require('fs');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const customsearch = google.customsearch('v1');

let data = {};
let hits = {value: -1,
            percentage: 0};

const sources = ["CNN", "NYTimes", "AP NEWS" , "Washington Post", "BBC News", "CBC", "Snopes.com"];
const skipWords = ["and", "a", "the", "but", "did", "at", "in", "an", "all", "for", "of", "so", "this", "why", "do", "with", "from", "it", "by", "also"];
//const superWords = ["not", "true", "false", "won", "win", "lost", "lose", "good", "bad"];
const failWords = ["proven false", "not true", "fake", "disputed", "did not happen", "allegations", "allegation","disproven", "baseless", "no evidence", "speculated", "photoshopped", "claims"];

const config = {
    GCP_API_KEY: 'AIzaSyAyFKaf_PlkioY6Gf1KRBm9g3XptWtdtjo',
    GCP_CX: '2dadced1c6a3865a0'
}

function cleanQueryForSearch(q) {
    var subArray = q.split(" ");
    var query = "\"";
    var skippedWord = false;
    for(var word of subArray) {
        if (skipWords.includes(word)) {
            if(!skippedWord) {
                query = query.substring(0, query.length - 1);
                query += "\" \"";
            }
            skippedWord = true;
        } else {
            query += word + " ";
            skippedWord = false;
        }
    }
    // for(var word of subArray) {
    //     if (skipWords.includes(word)) {
    //         // do nothing
    //     } else {
    //         query += '"' + word + '"';
    //     }
    // }
    query = query.substring(0, query.length - 1);
    query += "\"";
    // console.log('THIS PART' + query);
    return query;
}

function cleanQueryArray(q) {
    var subArray = q.split("\"");
    var newArray = [];
    for(var word of subArray) {
        if (!skipWords.includes(word) && word != ' ' && word != '') {
            newArray.push(word);
        }
    }
    //console.log(newArray)
    return newArray;
}

function checkFailWords(title, snippet) {
    for (var word of failWords) {
        if (title.includes(word) || snippet.includes(word)) {
            return true;
        }
    }
    return false;
    //comment
}

function checkQueryWithTitleAndSnippet(title, snippet, q) {
    var count = 0;
    var size = q.length;

    if(checkFailWords(title, snippet)) {
        console.log(title, snippet, q, "FAILED");
        return false;
    }
    for(var word of q) {
        if (title.includes(word) || snippet.includes(word)) {
            count++;
        }
    }
    if (size == 0) {
        return false;
    }
    console.log(title, snippet, q, (count/size) >= 0.7)
    return count/size >= 0.7;
}

function searchSources(sitename, twitter_name, title, snippet, q) {
    var check = checkQueryWithTitleAndSnippet(title, snippet, q);
    for(var s of sources) {
        if (sitename != null && sitename.includes(s) && check) {
            return true;
        }
        if (twitter_name != null && twitter_name.includes(s) && check) {
            return true;
        }
    }
    return false;
}

function analyzeSearchResults(q) {
    //TODO
    var goodHits = 0;
    //console.log(data);
    if (!data.bad) {
        for(var v of data.items){
            if (searchSources(v.sitename, v.twitter_name, v.title.toLowerCase(), v.snippet.toLowerCase(), q)) {
                goodHits++;
            }
        }
    } else {
        goodHits = -1;
    }
    return goodHits;
}

async function getResult(req) {
    var goodHits = 0;
    var startNum = 1;
    var query = '';
    if (req.body.q != undefined) {
        query = cleanQueryForSearch(req.body.q.toLowerCase());
    }
    const numArticles = 100;

    for(var i = 0; i < 10; i++) {
        await getData(query, startNum);
        //console.log(data);
        goodHits += analyzeSearchResults(cleanQueryArray(query));
        startNum += 10;
    }
    // DO CALCULATIONS HERE
    console.log(goodHits);
    hits.percentage = goodHits;
    var percentage = goodHits/numArticles;
    if (percentage < 0.0) {
        hits.value = 'No Data - Please Highlight Something Else';
    } else if (percentage <= 0.2) {
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
    console.log(hits.value, hits.percentage);
}

async function getData(query, begin) {
    //console.log(query);
    const q = query;
    const start = begin;
    const num = 10;
    //console.log(q, start, num);

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

        if (items != undefined) {
            data = {
                q,
                bad: false,
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
                title: o.title,
                }))
            };
        } else {
            data = {bad: true};
        }
        })
    } catch (err) {
        data = {bad: true};
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
// const PORT = 4000;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));