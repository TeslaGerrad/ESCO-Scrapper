##How to run it

##install node module (npm install)
then run (node .)

#if you have any issues with the proxyer provider Brightdata (https://brightdata.com/)you can visit there website and create your on active proxy vulables and have them replaced in the index.mja

After creating a scrapping browser on Brightdata you will be given these datails 
#Example
Host = brd.superproxy.io:9222
Username = brd-customer-hl_ff84e862-zone-scraping_browser2
Password = r1arbqjpl4ua

##then you can inset them like as follows...on index.mjs

    try {
        const auth = 'brd-customer-hl_ff84e862-zone-scraping_browser2:r1arbqjpl4ua';

        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`
        });
