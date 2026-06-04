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
        
        # Accept consent banner
        checkbox = page.locator("#consent-checkbox")
        await checkbox.wait_for(state="visible", timeout=10000)
        await checkbox.click()
        
        accept_btn = page.locator("#consent-accept-btn")
        await accept_btn.wait_for(state="visible", timeout=10000)
        await accept_btn.click()
        
        # Guest auth
        guest_btn = page.locator("#btn-guest-auth")
        await guest_btn.wait_for(state="visible", timeout=10000)
        await guest_btn.click()
        
        # Open AI Assistant
        ai_btn = page.locator("#btn-ai-planner")
        await ai_btn.wait_for(state="visible", timeout=10000)
        await ai_btn.click()
        
        # Fill prompt
        prompt_input = page.locator("#ai-prompt-input")
        await prompt_input.wait_for(state="visible", timeout=10000)
        await prompt_input.fill("Утром: тренировка и чтение Корана. Днем: работа над стартапом.")
        
        # Click Create Plan (which should prompt for API key if not saved)
        generate_btn = page.locator("#btn-generate-ai-plan")
        await generate_btn.wait_for(state="visible", timeout=10000)
        await generate_btn.click()
        
        # Fill mock Gemini Key
        api_key_input = page.locator("#ai-api-key")
        await api_key_input.wait_for(state="visible", timeout=10000)
        await api_key_input.fill("test-gemini-key-123")
        
        # Click Save Key
        save_key_btn = page.locator("#btn-save-ai-key")
        await save_key_btn.wait_for(state="visible", timeout=10000)
        await save_key_btn.click()
        
        # Click Create Plan again
        await generate_btn.click()
        
        # Wait for the AI tasks to be generated and modal to close
        await asyncio.sleep(4)
        
        # Verify AI task is visible in planner textareas
        found = False
        for _ in range(30):
            textareas = await page.locator("textarea").all()
            for ta in textareas:
                val = await ta.input_value()
                if "Автотест: ИИ задача 1" in val:
                    found = True
                    break
            if found:
                break
            await asyncio.sleep(0.5)
        assert found, "AI generated task should be visible in planner textareas"
        
        # Reload page
        await page.goto("http://localhost:5000/app.html")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
            
        # Verify it remains after reload
        found2 = False
        for _ in range(20):
            textareas = await page.locator("textarea").all()
            for ta in textareas:
                val = await ta.input_value()
                if "Автотест: ИИ задача 1" in val:
                    found2 = True
                    break
            if found2:
                break
            await asyncio.sleep(0.5)
        assert found2, "AI generated task should persist after reload"
        
        print("SUCCESS: TC016 complete!")
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