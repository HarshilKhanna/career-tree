# CareerTree: Career Path Visualizer

## Overview

CareerTree is an interactive web application designed to help users explore potential career paths stemming from various degrees or starting points. 

**What problem it solves:**
Traditional career guidance often relies on static lists or linear progression models. CareerTree solves this by providing a dynamic, visual, and branching map of how different roles connect—from entry-level positions all the way to career peaks. It helps users easily understand prerequisites, lateral moves, and potential long-term trajectories.

**Why this approach:**
We chose a node-based interactive tree visualization because it naturally represents branching career paths. It allows users to explore complex progressions intuitively, collapsing or expanding paths as needed to avoid information overload.

**Technologies Used:**
- **Next.js (App Router) & React:** Core framework for a robust and fast web application.
- **@xyflow/react (React Flow):** For rendering the interactive nodes, edges, and panning/zooming canvas.
- **Dagre:** Provides the algorithm for automatic, clean hierarchical layout of the career nodes.
- **Framer Motion:** Used for smooth animations and transitions to create a polished user experience.
- **Tailwind CSS:** For styling, ensuring a responsive and consistent design.

## How to Run the Project Locally

### Prerequisites
- Node.js (v18 or higher)
- A package manager (npm, yarn, pnpm, or bun)

### Setup Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **View the application:**
   Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## Project Structure Highlights

- `app/page.tsx`: The main landing page where users select their degree to start the flow.
- `app/tree/`: The core visualization page where the interactive career tree is rendered.
- `app/admin/`: A built-in admin dashboard used to easily manage and update tree content (nodes and connections) without needing to modify the codebase directly.
- `components/`: Contains reusable UI components, including the canvas viewer (`TreeViewer.tsx`) and node editor (`AdminNodeEditor.tsx`).
