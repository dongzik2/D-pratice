
# Blueprint: Pachinko Number Lottery Game

## Overview

This is an interactive web game titled "Pachinko Simulator". It features a dark, royal blue theme and a balanced, full-width layout that fills the screen, inspired by the user-provided reference image.

## Core Features

*   **Main Title:** A prominent "빠칭코 시뮬레이터" title at the top of the application.
*   **Visual Theme:** A refined color scheme featuring a deep blue background, golden text highlights, pink for 'SSS', and dark purple for 'SS'.
*   **Balanced Full-Width Layout:**
    *   The main game wrapper is significantly wider to fill the horizontal space, removing any awkward gaps on the right.
    *   The right-side game area is vertically centered, creating a visually pleasing and balanced alignment.
*   **Enlarged Game Board:** The 7x7 grid of cards is larger, making the game more immersive. The font size of the numbers is increased proportionally for better readability.
*   **Sidebar:** Contains all controls and information panels on the left.
*   **Board Clear Reward:** When all 49 cards are flipped, the user is automatically awarded 1 free ticket and the game board resets.
*   **Dynamic Hint System:** The hint tracker, featuring numbered, sunken shield steps, is positioned with more vertical space for a cleaner look.

## Current Plan (Layout Finalization & Resizing)

1.  **Update `main.js` (Component Styles):**
    *   **Widen the Game Wrapper:**
        *   Modify the `.game-wrapper` style by increasing its overall `width` (e.g., to `1000px`) to make the entire component larger and fill the screen.
    *   **Vertically Center the Game Area:**
        *   Add `justify-content: center;` to the `.game-board-area` flex container to vertically align the hint tracker and the game board, creating balanced spacing.
    *   **Increase Font Size:**
        *   Increase the `font-size` of `.card-front` and `.card-back` (e.g., to `2.2rem`) to make the numbers larger and more readable on the newly enlarged cards.
