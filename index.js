const { askPuppeteer } = require('./ScrapeLogic')

const express = require("express");

const app = express()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log("Listening on Port: ", PORT)
})

app.get('/scrape', async (req, res) => {

    const { query } = req.query
    const result = await askPuppeteer(query)
    console.log(result)
    res.json(result)
})







