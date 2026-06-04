import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        pw = await async_api.async_playwright().start()
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )
        context = await browser.new_context()
        context.set_default_timeout(15000)
        page = await context.new_page()
        
        # Navigate
        await page.goto("http://localhost:5000")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # Accept consent banner using IDs
        checkbox = page.locator("#consent-checkbox")
        await checkbox.wait_for(state="visible", timeout=10000)
        await checkbox.click()
        
        accept_btn = page.locator("#consent-accept-btn")
        await accept_btn.wait_for(state="visible", timeout=10000)
        await accept_btn.click()
        
        # Dismiss cloud sync/login modal via guest button directly
        guest_btn = page.locator("#btn-guest-auth")
        await guest_btn.wait_for(state="visible", timeout=10000)
        await guest_btn.click()
        
        # Open burger menu first
        burger_btn = page.locator("#burger-menu-toggle")
        await burger_btn.wait_for(state="visible", timeout=10000)
        await burger_btn.click()
        
        # Click the tab-goals button to open the goals page
        tab_goals = page.locator("#tab-goals")
        await tab_goals.wait_for(state="visible", timeout=10000)
        await tab_goals.click()
        
        # Close sidebar drawer so it doesn't intercept pointer events
        close_drawer_btn = page.locator("#sidebar-close-btn")
        await close_drawer_btn.wait_for(state="visible", timeout=10000)
        await close_drawer_btn.click()
        
        # Fill goal title
        custom_title = page.locator("#goal-custom-ahirat-title")
        await custom_title.wait_for(state="visible", timeout=10000)
        await custom_title.fill("Akhira Progress Goal")
        
        # Fill goal details
        custom_desc = page.locator("#goal-custom-ahirat")
        await custom_desc.wait_for(state="visible", timeout=10000)
        await custom_desc.fill("Increase daily prayers, read daily Quran, keep regular tracker.")
        
        # Press Add goal button
        add_btn = page.locator("#add-custom-ahirat")
        await add_btn.wait_for(state="visible", timeout=10000)
        await add_btn.click()
        
        print("SUCCESS: TC013 complete!")
        await asyncio.sleep(2)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

if __name__ == "__main__":
    asyncio.run(run_test())