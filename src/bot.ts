import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin
puppeteer.use(StealthPlugin());

async function addToCart() {
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    });
    const page = await browser.newPage();
    
    try {
        // Set navigation timeout to 30 seconds
        page.setDefaultNavigationTimeout(30000);
        
        // Navigate to the product page
        await page.goto('https://www.on.com/en-us/products/cloudmonster-61/mens/all-black-shoes-61.99025', {
            waitUntil: 'networkidle0'
        });

        // Select the first size button
        await page.evaluate(() => {
            const firstSizeButton = document.querySelector('[data-test-id="purchasePodSizeButton"]');
            if (firstSizeButton instanceof HTMLElement) {
                firstSizeButton.click();
            } else {
                throw new Error('Size button not found');
            }
        });

        // Wait a bit for the size selection to register
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click the "Add to bag" button
        await page.evaluate(() => {
            const addToBagButton = document.querySelector('[data-test-id="addToCartButton"]');
            if (addToBagButton instanceof HTMLElement) {
                addToBagButton.click();
            } else {
                throw new Error('Add to bag button not found');
            }
        });

        // Wait for 2 seconds as requested
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click the checkout button
        await page.evaluate(() => {
            const checkoutButton = document.querySelector('[data-test-id="checkoutBtn"]');
            if (checkoutButton instanceof HTMLElement) {
                checkoutButton.click();
            } else {
                throw new Error('Checkout button not found');
            }
        });

        // Wait for navigation to checkout
        await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

// Run the bot
addToCart().catch(console.error);