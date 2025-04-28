import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin
puppeteer.use(StealthPlugin());

async function fillShippingForm(page: any) {
    try {
        // Fill in first name
        await page.type('input[name="firstName"]', 'Zeeshan');
        
        // Fill in last name
        await page.type('input[name="lastName"]', 'Khan');
        
        // Fill in address (using a sample address in Illinois)
        await page.type('input[name="address1"]', '123 Main Street');
        
        // Fill in city
        await page.type('input[name="city"]', 'Chicago');
        
        // Fill in ZIP code (Chicago ZIP code)
        await page.type('input[name="postalCode"]', '60601');
        
        // Fill in phone number
        await page.type('input[name="phone"]', '123-456-7890');

        // Short delay to ensure all fields are filled
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('Error filling shipping form:', error);
        throw error;
    }
}

// Modify the addToCart function to include the new shipping form step
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

        // Wait for and click the first size button
        await page.waitForSelector('[data-test-id="purchasePodSizeButton"]');
        await page.click('[data-test-id="purchasePodSizeButton"]');

        // Wait a bit for the size selection to register
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click the "Add to bag" button
        await page.waitForSelector('[data-test-id="addToCartButton"]');
        await page.click('[data-test-id="addToCartButton"]');

        // Wait for 2 seconds as requested
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click the checkout button
        await page.waitForSelector('[data-test-id="checkoutBtn"]');
        await page.click('[data-test-id="checkoutBtn"]');

        // Wait for navigation and then fill shipping form
        await page.waitForSelector('input[name="firstName"]');
        await page.type('#email', 'zeeshankhan123@gmail.com')
        await fillShippingForm(page);

    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the browser
        await browser.close();
    }
}

// Run the bot
addToCart().catch(console.error);