const puppeteer = require('puppeteer');
require("dotenv").config()
let result = []

//function which scrapes the selected stackoverflow pages
const getAnswerFromQuestion = async (website, page) => {
    await page.goto(website, ["load", "domcontentloaded", "networkidle0"]);
    const question = await page.evaluate(() => document.querySelector('#question-header > h1 > a').innerText)

    const verifiedAnswer = await page.evaluate(() => {
        let answer_p_list = document.querySelector('div > div > div.answercell.post-layout--right > div.s-prose.js-post-body')
        let children = Array.from(answer_p_list.querySelectorAll('*'))
        let answer = ""
        let i = 0
        children.forEach((child) => {
            answer = answer + " " + child.innerText
        })
        return answer
    })

    let newEntry = {
        question: question,
        answer: verifiedAnswer
    }
    result.push(newEntry)
    // console.log('\nQ:\n', question)
    // console.log('\nAns:\n', verifiedAnswer)
}

const askPuppeteer = async (query) => {
    if (query == undefined || query.length < 5) return []


    const browser = await puppeteer.launch({
        args: [
            "--diable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
        executablePath:
            process.env.NODE_ENV === "production"
                ? process.env.PUPPETEER_EXECUTABLE_PATH
                : puppeteer.executablePath(),
    })

    //question you want to ask

    const queryWordArray = query.split(" ");
    const queryUrl = `${query.replace(/ /g, "%20")}`;
    const googleUrl = `https://www.google.com/search?q=${queryUrl}+site%3Astackoverflow.com`;
    console.log(googleUrl)
    console.log('queryURL: ', queryUrl)
    result = []
    try {
        const page = await browser.newPage();

        await page.goto(googleUrl, ["load", "domcontentloaded", "networkidle0"])

        const validUrls = await page.evaluate((queryUrl) => {
            const hrefElementsList = Array.from(
                // document.querySelectorAll(
                //     `div[data-async-context='query:${queryUrl}%20site%3Astackoverflow.com'] a[href]`
                // )
                document.querySelectorAll(
                    "#rso > div > div > div > div > div > a"
                )
            );


            const filterElementsList = hrefElementsList.filter((elem) =>
                elem
                    .getAttribute("href")
                    .startsWith("https://stackoverflow.com/questions")
            );

            const stackOverflowLinks = filterElementsList.map((elem) =>
                elem.getAttribute("href")
            );

            return stackOverflowLinks;
        }, queryUrl)

        const keywordLikeability = [];
        //select those urls which contain atleast half of the words in the query
        validUrls.forEach((url) => {
            let wordCounter = 0;

            queryWordArray.forEach((word) => {
                console.log('Word: ', word, ' wc: ', wordCounter)
                if (url.indexOf(word) > -1) {
                    wordCounter = wordCounter + 1;
                }
            });

            if (queryWordArray.length / 3 < wordCounter) {
                keywordLikeability.push({
                    keywordMatch: wordCounter,
                    url: url,
                });
            }
        });



        await (async function () {
            for (var i = 0; i < keywordLikeability.length; i++) {
                if (i < 4) {
                    await getAnswerFromQuestion(
                        keywordLikeability[i].url,
                        page
                    );
                }
            }

        })();
    } catch (e) {
        console.error(e)
    } finally {
        await browser.close();
        return result
    }
}



module.exports = { askPuppeteer }


