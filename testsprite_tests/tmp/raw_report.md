
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** Islamic Planner
- **Date:** 2026-03-20
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 Switch landing language to English and open the app with language preserved
- **Test Code:** [TC001_Switch_landing_language_to_English_and_open_the_app_with_language_preserved.py](./TC001_Switch_landing_language_to_English_and_open_the_app_with_language_preserved.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- App page URL is 'http://localhost:3000/app', not '/app.html' as expected after clicking Open App.
- Language parameter 'lang=en' is not present in the URL after navigation to the app.
- Page UI (Cloud Sync modal and labels) is displayed in Russian, indicating the English language selection was not preserved on app navigation.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/b68a36eb-4234-4f59-a078-7eb50f8d05aa
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 Open the app from landing page without changing language
- **Test Code:** [TC002_Open_the_app_from_landing_page_without_changing_language.py](./TC002_Open_the_app_from_landing_page_without_changing_language.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/376f9423-c960-418e-b3c8-e7dca9716fbd
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 Switch landing language to Arabic and successfully open the app
- **Test Code:** [TC003_Switch_landing_language_to_Arabic_and_successfully_open_the_app.py](./TC003_Switch_landing_language_to_Arabic_and_successfully_open_the_app.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/ea034d01-6d95-4a49-a2dd-61e6a81878af
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 Arabic localization missing: show fallback notice and allow opening the app
- **Test Code:** [TC004_Arabic_localization_missing_show_fallback_notice_and_allow_opening_the_app.py](./TC004_Arabic_localization_missing_show_fallback_notice_and_allow_opening_the_app.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/a16b4e60-084c-4f8a-8f4b-1e1f21726cc1
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 Rapid language switching ends in English state
- **Test Code:** [TC005_Rapid_language_switching_ends_in_English_state.py](./TC005_Rapid_language_switching_ends_in_English_state.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Open App navigated to /app, not /app.html (URL observed: http://localhost:3000/app)
- URL after opening the app does not contain 'lang=en' (language parameter is missing from the current URL)
- Language UI indicates 'RU' is active after opening the app, not 'EN' as expected from the prior selection
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/1de35740-a36f-4977-815d-19256b418209
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 Language switchers remain available after switching language
- **Test Code:** [TC006_Language_switchers_remain_available_after_switching_language.py](./TC006_Language_switchers_remain_available_after_switching_language.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/a71bab7c-80f4-43f8-baa6-b9714a1ff5ef
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 Namaz Tracker renders with next prayer and countdown
- **Test Code:** [TC007_Namaz_Tracker_renders_with_next_prayer_and_countdown.py](./TC007_Namaz_Tracker_renders_with_next_prayer_and_countdown.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/9e41bef9-7ecb-4c0c-859e-b08622ce57ea
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 Prayer times list shows all five prayers
- **Test Code:** [TC008_Prayer_times_list_shows_all_five_prayers.py](./TC008_Prayer_times_list_shows_all_five_prayers.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/8e9ec0ac-8a3d-4c71-8549-489173b7ae88
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 Mark a prayer as completed updates UI state
- **Test Code:** [TC009_Mark_a_prayer_as_completed_updates_UI_state.py](./TC009_Mark_a_prayer_as_completed_updates_UI_state.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync/login modal is visible and blocks interaction with the prayer tracker UI.
- Modal could not be dismissed after 2 Escape key attempts and 2 clicks on the modal close button.
- Login attempt (email/password filled and 'Войти' clicked) did not dismiss the modal; an error message 'Неверный логин или пароль' is shown.
- Unable to click the 'Фаджр' checkbox because the modal overlay intercepts interactions.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/f4d7c73b-c1dd-4c14-a7f5-a9cbff15ac6f
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 Prayer completion state persists after page reload (local save)
- **Test Code:** [TC010_Prayer_completion_state_persists_after_page_reload_local_save.py](./TC010_Prayer_completion_state_persists_after_page_reload_local_save.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync modal is visible on page and blocks interactions, preventing access to the tracker and checkboxes.
- No visible close or dismiss control for the cloud sync modal was found, and pressing Escape did not close it.
- Dhuhr checkbox could not be clicked because the modal overlay prevents interacting with underlying elements.
- The test cannot proceed to verify persistence after reload due to the blocking modal.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/39258387-6272-4c93-82ad-6a98372ec327
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC011 Multiple prayers can be marked completed independently
- **Test Code:** [TC011_Multiple_prayers_can_be_marked_completed_independently.py](./TC011_Multiple_prayers_can_be_marked_completed_independently.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync / login modal is displayed and blocks access to the underlying prayer tracker UI.
- Asr checkbox element not found among the page's interactive elements, preventing the intended interaction.
- Maghrib checkbox element not found among the page's interactive elements, preventing the intended interaction.
- No visible dismiss/close control for the cloud sync modal is available to allow testing of underlying elements.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/79b4a59c-deb5-441b-a06a-6efb2db481a2
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC012 Unchecking a completed prayer updates UI state
- **Test Code:** [TC012_Unchecking_a_completed_prayer_updates_UI_state.py](./TC012_Unchecking_a_completed_prayer_updates_UI_state.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/eff9ad83-6538-456c-9809-a84b7454e747
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC013 View Goals grouped into Akhira and Dunya on the Goals tab
- **Test Code:** [TC013_View_Goals_grouped_into_Akhira_and_Dunya_on_the_Goals_tab.py](./TC013_View_Goals_grouped_into_Akhira_and_Dunya_on_the_Goals_tab.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync/login modal is visible and overlays the application, preventing interaction with underlying tabs and content.
- Goals tab ("Цели") clickable element not available as an interactive control while the modal is present.
- Unable to open the Goals view, so the grouped sections 'Akhira' and 'Dunya' could not be verified.
- 'Goals list' element could not be located or validated because the modal blocks access to the app UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/b18d6507-1adf-4f26-9c96-e756c75ada8b
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC014 Open a goal and view its task list
- **Test Code:** [TC014_Open_a_goal_and_view_its_task_list.py](./TC014_Open_a_goal_and_view_its_task_list.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync/login modal remains visible and blocks access to the Goals UI after multiple dismissal attempts (Escape x2, modal close click x2, and submitting login).
- Goals tab and goals list could not be clicked because the modal overlays the page and intercepts input.
- Login attempt using provided test credentials did not dismiss the modal and did not grant access to the underlying UI.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/baba3e26-0de8-4f88-b88b-edc856e96a75
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC015 Mark a task as completed and see it reflect as completed
- **Test Code:** [TC015_Mark_a_task_as_completed_and_see_it_reflect_as_completed.py](./TC015_Mark_a_task_as_completed_and_see_it_reflect_as_completed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/d60e77ff-ccc8-414c-b32d-5c8595a63a37
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC016 Task completion persists locally after app reload
- **Test Code:** [TC016_Task_completion_persists_locally_after_app_reload.py](./TC016_Task_completion_persists_locally_after_app_reload.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Cloud sync modal is visible on the page and blocks interaction with the app UI.
- Cloud sync modal remained visible after two Escape key presses (dismiss attempt limit reached).
- Goals tab and underlying page elements could not be interacted with because the modal is blocking the UI.
- The test cannot proceed to verify that a completed task remains completed after reload because required UI interactions are inaccessible.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/f4ee11fb-5c1a-4c33-9669-c532cba18158
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC017 Toggle a completed task back to incomplete
- **Test Code:** [TC017_Toggle_a_completed_task_back_to_incomplete.py](./TC017_Toggle_a_completed_task_back_to_incomplete.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Goals tab not found as an interactive element on the page; no clickable element labeled 'Цели' is available.
- Cloud synchronization modal 'Облачная синхронизация' is displayed and blocks access to the underlying UI; no identifiable close control is available to dismiss it.
- Unable to open a goal or toggle task completion because the Goals UI is not reachable from the current page state.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/e89bba35-e71b-415c-915c-2181824875d9
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC018 Switch between Akhira and Dunya goals and view tasks for each
- **Test Code:** [TC018_Switch_between_Akhira_and_Dunya_goals_and_view_tasks_for_each.py](./TC018_Switch_between_Akhira_and_Dunya_goals_and_view_tasks_for_each.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- ASSERTION: Cloud sync/login modal present on page and centered, blocking underlying UI.
- ASSERTION: Modal dismissal attempts using Escape key and audit-modal-close button did not close the modal.
- ASSERTION: Goals tab could not be activated because the modal intercepts clicks.
- ASSERTION: No visible alternative or bypass exists on the page to view Goals content without signing in.
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/a33affef-0995-435b-80b1-3bdfc3ab1728
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC019 Goals tab loads without errors when no goal is selected
- **Test Code:** [TC019_Goals_tab_loads_without_errors_when_no_goal_is_selected.py](./TC019_Goals_tab_loads_without_errors_when_no_goal_is_selected.py)
- **Test Error:** TEST FAILURE

ASSERTIONS:
- Goals tab is not present as an interactive element on the page (no clickable element matching 'Goals' / 'Цели' found).
- Cloud sync modal overlay is visible and blocking interaction with the underlying UI, preventing navigation to the Goals tab.
- Verification of the 'Goals list' visibility could not be performed because navigation to the Goals tab was not possible.
- Verification that the 'Tasks list' is not visible could not be performed because the Goals tab could not be selected.

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/8e91a673-2342-4c99-a669-f621607463fc/c9a99363-b1fd-470a-905b-cdb8747a4551
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **42.11** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---