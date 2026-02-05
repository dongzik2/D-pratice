
# Blueprint: FC온라인 빠칭코 시뮬레이터

## Overview

This is an interactive web game titled "FC온라인 빠칭코 시뮬레이터". It features a dark, royal blue theme and a balanced, full-width layout that provides a premium, immersive user experience.

## Core Features

*   **Main Title:** A prominent "FC온라인 빠칭코 시뮬레이터" title.
*   **Visual Theme:** A refined color scheme with a deep blue background and vibrant card grades.
*   **Interactive Card Hover Effect:** Provides clear visual feedback on card hover.
*   **Confirmation Modal:** A stylish, light-themed confirmation modal prevents accidental ticket usage. It features a header, a two-part message, and full-width, two-panel action buttons, closely matching the user-provided reference image.
*   **Stable Full-Width Layout:** The layout remains stable on content changes.
*   **Enlarged Game Board:** A large, immersive 7x7 grid.
*   **Sidebar & Controls:** Well-organized controls and information panels.
*   **Board Clear Reward:** Awards a free ticket and resets the board after completion.
*   **Dynamic Hint System:** A multi-step hint tracker.

## Current Plan (Redesign Confirmation Modal)

1.  **Update `main.js` (Web Component):**
    *   **Update Modal HTML:**
        *   Add a `.modal-header` with a title and a close button (`&times;`).
        *   Update the message area to include a primary (green) and secondary (gray) text line.
        *   Restructure the `.modal-buttons` to contain two full-width buttons side-by-side.
    *   **Update Modal CSS:**
        *   Change `.modal-content` to a white background with a light gray border and remove padding.
        *   Style the new `.modal-header`, `.modal-body`, and `.modal-footer` sections.
        *   Style the primary message text to be green and bold.
        *   Style the secondary message text to be smaller and gray.
        *   Make the "취소" (black) and "확인" (green) buttons fill the footer space (`flex: 1`).
    *   **Update Modal Logic:**
        *   Add an event listener to the new close button to hide the modal.

2.  **Push to GitHub:**
    *   Commit the redesigned modal feature to the `dongzik2/D-pratice` repository.
