import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 412, "height": 915})
        await page.goto("http://localhost:4173")
        await page.wait_for_selector("text=IRON FRONT")
        # Click START CAMPAIGN button
        await page.click("text=START CAMPAIGN")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/campaign_ui.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
