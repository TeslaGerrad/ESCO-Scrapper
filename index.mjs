import puppeteer from "puppeteer-core";
import fs from 'fs';
import ExcelJS from 'exceljs';

async function run() {
    let browser;
    try {
        const auth = 'brd-customer-hl_ff84e862-zone-scraping_browser2:r1arbqjpl4ua';

        browser = await puppeteer.connect({
            browserWSEndpoint: `wss://${auth}@brd.superproxy.io:9222`
        });

        // Read preferred labels and URLs from preferredLabels.json
        const preferredLabelsData = fs.readFileSync('Labels1.json');
        const preferredLabelsAndURLs = JSON.parse(preferredLabelsData).preferredLabelsAndURL;

        // Create a new workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('ESCO Occupation');

        // Set up worksheet columns
        worksheet.columns = [
            { header: 'Name', key: 'name' },
            { header: 'Link', key: 'link' },
            { header: 'Transversal Skill', key: 'transversalSkill' }
        ];

        // Loop through preferred labels and URLs sequentially
        for (const preferredLabelAndURL of preferredLabelsAndURLs) {
            const [name, url] = preferredLabelAndURL.split(' : ');

            // Create a new page for each URL
            const page = await browser.newPage();
            page.setDefaultNavigationTimeout(5 * 60 * 1000); // Increased timeout to 5 minutes

            try {
                // Navigate to the URL
                await page.goto(url);

                // Wait for the breadcrumb_item div to be available
                await page.waitForSelector('.alternative-labels');

                // Scraping names and links from the breadcrumb_item div
                const skills = await page.evaluate(() => {
                    const skillsList = [];
                    const breadcrumbItemDivs = document.querySelectorAll('.alternative-labels');
                    breadcrumbItemDivs.forEach(breadcrumbItemDiv => {
                        const skillLinks = breadcrumbItemDiv.querySelectorAll('p a');
                        skillLinks.forEach(link => {
                            const name = link.textContent.trim();
                            const url = link.getAttribute('href');
                            skillsList.push({ name, url });
                        });
                    });
                    return skillsList;
                });

                // Compare scraped names with TransversalSkills.json
                const transversalSkillsData = fs.readFileSync('TransversalSkills.json');
                const transversalSkills = JSON.parse(transversalSkillsData).TransversalSkills;

                // Add matched skills to the worksheet
                if (skills.length === 0) {
                    worksheet.addRow({ name: 'Not applicable', link: 'Not applicable', transversalSkill: name });
                } else {
                    const matchedSkills = skills.filter(skill => transversalSkills.includes(skill.name));
                    if (matchedSkills.length === 0) {
                        worksheet.addRow({ name: 'No TransversalSkills', link: 'No TransversalSkills', transversalSkill: name });
                    } else {
                        matchedSkills.forEach(skill => {
                            worksheet.addRow({ name: skill.name, link: skill.url, transversalSkill: name });
                        });
                    }
                }
            } catch (error) {
                console.error(`Scraping failed for URL: ${url}`, error);
                if (error.name === 'TimeoutError') {
                    console.error(`Link Not applicable : ${url}`);
                    worksheet.addRow({ name: 'Not applicable', link: 'Not applicable', transversalSkill: name });
                } else {
                    console.error(`No TransversalSkills : ${url}`);
                    worksheet.addRow({ name: 'No TransversalSkills', link: 'No TransversalSkills', transversalSkill: name });
                }
            } finally {
                // Close the page
                await page.close();
            }

            // Introduce a delay of 30 seconds between page navigations
            await new Promise(resolve => setTimeout(resolve, 30000));
        }

        // Save the workbook to an Excel file
        await workbook.xlsx.writeFile('ESCO Occupation.xlsx');

        console.log('Excel file created successfully.');

    } catch (e) {
        console.error('Scrape failed', e);
    } finally {
        await browser?.close();
    }
}

run();
