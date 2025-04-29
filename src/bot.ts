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

    await page.click('#checkout-pay-button');
}

async function fillPaymentForm(page: any) {
    try {
        // Each field is in its own iframe, so we need to handle them separately
        
        // Handle card number iframe
        const cardNumberFrame = await page.waitForSelector('[name^="card-fields-number"]');
        const numberFrame = await cardNumberFrame.contentFrame();
        await numberFrame.waitForSelector('[name="number"]');
        await numberFrame.type('[name="number"]', '340259577955900');

        // Handle expiry date iframe
        const expiryFrame = await page.waitForSelector('[name^="card-fields-expiry"]');
        const expFrame = await expiryFrame.contentFrame();
        await expFrame.waitForSelector('[name="expiry"]');
        await expFrame.type('[name="expiry"]', '1226');

        // Handle CVV iframe
        const cvvFrame = await page.waitForSelector('[name^="card-fields-verification_value"]');
        const securityFrame = await cvvFrame.contentFrame();
        await securityFrame.waitForSelector('[name="verification_value"]');
        await securityFrame.type('[name="verification_value"]', '956');

        // Short delay to ensure all fields are filled
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Click the checkbox to use shipping address as billing address if it exists
        try {
            await page.waitForSelector('#billingAddress', { timeout: 2000 });
            await page.click('#billingAddress');
        } catch (error) {
            console.log('Billing address checkbox not found, continuing...');
        }

    } catch (error) {
        console.error('Error filling payment form:', error);
        throw error;
    }
}

// Modify the addToCart function to include the new shipping form step
async function addToCart() {
    const browser = await puppeteer.launch({ 
        headless: false,
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    });
    
    const page = await browser.newPage();
    
    try {
        // Set navigation and timeout settings
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(30000);
        
        // Set up request interception to only skip images
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            // Only skip images to maintain proper site formatting
            if (request.resourceType() === 'image') {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Navigate to the product page
        await page.goto('https://www.on.com/en-us/products/cloudmonster-61/mens/all-black-shoes-61.99025', {
            waitUntil: 'networkidle2', // Changed to networkidle2 for better stability
            timeout: 60000
        });

        // Additional wait for network to be relatively idle
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Wait for and verify that size buttons are present
        const sizeButtonsExist = await page.waitForFunction(() => {
            const buttons = document.querySelectorAll('button[data-test-id="purchasePodSizeButton"]');
            return buttons.length > 0;
        }, { timeout: 15000 }).catch(() => false);

        if (!sizeButtonsExist) {
            throw new Error('Size buttons not found after waiting');
        }

        // Click the first available size button with retry mechanism
        let sizeSelected = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            sizeSelected = await page.evaluate((selector) => {
                const buttons = document.querySelectorAll(selector);
                for (const button of buttons) {
                    if (button instanceof HTMLButtonElement && !button.disabled) {
                        button.click();
                        return true;
                    }
                }
                return false;
            }, 'button[data-test-id="purchasePodSizeButton"]');

            if (sizeSelected) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!sizeSelected) {
            throw new Error('Failed to select a size after multiple attempts');
        }

        // Wait for and click add to cart button with retry
        await page.waitForFunction(() => {
            const button = document.querySelector('button[data-test-id="addToCartButton"]');
            return button instanceof HTMLButtonElement && !button.disabled;
        }, { timeout: 15000 });

        let addedToCart = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            addedToCart = await page.evaluate(() => {
                const button = document.querySelector('button[data-test-id="addToCartButton"]');
                if (button instanceof HTMLButtonElement && !button.disabled) {
                    button.click();
                    return true;
                }
                return false;
            });

            if (addedToCart) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        if (!addedToCart) {
            throw new Error('Failed to add to cart after multiple attempts');
        }

        // Wait for and click checkout button with retry
        await page.waitForFunction(() => {
            const button = document.querySelector('button[data-test-id="checkoutBtn"]');
            return button instanceof HTMLButtonElement && !button.disabled;
        }, { timeout: 15000 });

        let checkedOut = false;
        for (let attempt = 0; attempt < 3; attempt++) {
            checkedOut = await page.evaluate(() => {
                const button = document.querySelector('button[data-test-id="checkoutBtn"]');
                if (button instanceof HTMLButtonElement && !button.disabled) {
                    button.click();
                    return true;
                }
                return false;
            });

            if (checkedOut) break;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Wait for navigation and then fill shipping form
        await page.waitForSelector('input[name="firstName"]', {
            visible: true,
            timeout: 20000
        });
        
        await page.type('#email', 'zeeshankhan123@gmail.com')
        await fillShippingForm(page);
        
        // Now fill the payment form
        await fillPaymentForm(page);

        // Keep the browser open
        console.log('Process completed. Browser will remain open.');
        
    } catch (error) {
        console.error('An error occurred:', error);
        try {
            await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
            console.log('Error screenshot saved as error-screenshot.png');
        } catch (screenshotError) {
            console.error('Failed to save error screenshot:', screenshotError);
        }
        throw error; // Re-throw the error to be caught by the final catch block
    }
}

// Run the bot
addToCart().catch(console.error);