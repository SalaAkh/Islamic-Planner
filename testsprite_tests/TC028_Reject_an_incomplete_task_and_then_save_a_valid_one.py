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
        
        # Navigate to page
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
        
        # Click the 'Отметить задачу 1' button when it is empty to trigger validation
        task_btn = page.locator("button[data-task-id='task1']")
        await task_btn.wait_for(state="visible", timeout=10000)
        await task_btn.click()
        
        # Verify validation error is displayed in the toast
        toast_text = page.locator("#toast-text")
        await toast_text.wait_for(state="visible", timeout=10000)
        toast_content = await toast_text.inner_text()
        assert any(x in toast_content for x in ["не может быть пустым", "cannot be empty", "бос болмауы керек", "فарغًا"]), f"Expected empty validation toast, got: {toast_content}"
        
        # Fill in valid details
        textarea = page.locator("#task1")
        await textarea.wait_for(state="visible", timeout=10000)
        await textarea.fill("Позвонить маме")
        
        # Click the mark/save button again
        await task_btn.click()
        
        # Verify task is successfully marked done (class 'task-done' appears)
        await expect(task_btn).to_have_class(re.compile(r"task-done"))
        
        await asyncio.sleep(2)
        print("SUCCESS: TC028 complete!")
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

if __name__ == "__main__":
    asyncio.run(run_test())