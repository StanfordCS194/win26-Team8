# Chrome Extension Build

This app can be bundled as a Chrome extension using Expo's web export.

## Build

1. From `mindful/`, install dependencies:
   - `npm install`
2. Build the website (optional, keeps web output):
   - `npm run build:web`
3. Build the extension bundle:
   - `npm run build:extension`
4. Build popup bundle whenever modifications are made to popup.tsx or extension/src/popup.css:
   - `npm run build:popup`

## Load in Chrome

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the `mindful/extension` folder

The popup will load the Expo web build from `extension/index.html`.
