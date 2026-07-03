**LectureAI standalone project**

**About**

This app now runs as a local Vite project with no external backend entities or auth setup required.

It stores projects in browser local storage and generates placeholder lesson scenes locally so you can run it immediately in VS Code.

**Edit the code in your local development environment**

Any change you make in the repo is enough to update the standalone app.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Run the app: `npm run dev`

**Notes**

- Projects persist in local storage in the browser.
- The app seeds a sample lesson so the dashboard is not empty on first launch.
- Uploaded text files are read locally; other file types use generated lesson summaries.
