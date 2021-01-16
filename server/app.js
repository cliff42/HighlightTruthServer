require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());

const GCP_API_KEY = process.env.GOOGLE_APPLICATION_CREDENTIALS;

//endpoints

app.post('/postText', async (req, res) => {
    try {
        res.status(200).send(
            await app.get('https://www.googleapis.com/customsearch/v1?key=I'+GCP_API_KEY+'&cx=017576662512468239146:omuauf_lfve&q='+req
            ));
    } catch (err) {
        console.log(err);
    }
});


// ----------------------------------------------------------------------------------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`server listening on port ${PORT}`));