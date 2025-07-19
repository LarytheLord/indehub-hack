# Echoe App

A map-based audio experience for discovering and creating anonymous echoes—voice notes tied to geographic locations. Anonymous users can explore, listen to, and contribute to a growing global sound map.

## Features

- **Interactive Map of Echoes**
  - See echoes (audio pins) near your location.
  - Tap any marker on the map to play its associated audio.
  - Smooth marker interactions and robust user feedback.

- **Audio Playback**
  - Fast, in-app audio streaming from echo markers.
  - Handles loading, playback, and resource cleanup for smooth user experience.

- **User Location Integration**
  - Displays your current location on the home screen.
  - Centers the map based on your real-time position.

- **Reliable Error Handling**
  - Graceful feedback for missing audio, location permission failures, and network issues.
  - "Loading..." states and clear user alerts/noitfications.

- **Code Quality & Separation**
  - Modular components, clear state management, and maintainable structure.
  - Avoids redundant network or location fetching.

## Completed Technical Work

- **Marker Interactivity:** `MapViewComponent` supports an `onMarkerPress` handler, enabling audio-enabled markers.
- **Audio Engine:** Integrated `expo-av` for playback. Handles play/pause, resource cleanup, and audio error cases.
- **Location Services:** Uses `expo-location` to fetch the user’s position and provide it to map components.
- **Home Screen Updates:** Display logic improved to wait for user location, with feedback indicators.
- **Performance Refinements:** Cleaned up redundant styles and resolved directory errors with dependency and bundler management.
- **Separation of Concerns:** Core logic for echo discovery and playback isolated from home screen presentation code.

## What’s Next

### Core Features
- **Echo Recording & Upload (record.tsx)**
  - Allow anyone to record audio directly in-app.
  - Tag audio recordings with the device’s current coordinates.
  - Upload new echoes to a Supabase backend.

- **Enhanced Map Browsing**
  - Filtering echoes (by recency, categories, etc.).
  - Better submission flow for adding new echoes from the map.
  - Custom map styles and improved visuals.

- **Optimized Marker Rendering**
  - Efficiently handle and render large numbers of anonymous echoes.

- **"My Echoes" (Anonymous Context)**
  - Display recently played or recorded echoes (device-local history).
  - Robust device-based approach to "personal" history without authentication.

- **Notification System**
  - Local or push alerts for nearby echoes and new echo events.

- **User Feedback Enhancements**
  - More informative loading, success, and error messages.
  - Persistent notifications for important updates.

### Technical & Quality Goals
- **Testing**
  - Unit tests for components and utilities.
  - Integration tests for map, audio, and backend logic.
  - End-to-end flows for anonymous echo discovery and recording.

- **Accessibility (A11y)**
  - Ensure ease of use for all users, across device types.

- **Deployment Readiness**
  - App store submission process, build configuration, and release management.

- **Continuous Performance Optimization**
  - Keep interactions smooth and maintain a minimal bundle size.

## Known Limitations

- No user accounts: "My Echoes" limited to device-local echoes/recordings; not portable across devices.
- Echo management tied to device identifier or local storage due to anonymous usage.
- Features under active development: recording, uploading, filtering, notifications, and accessibility improvements.

## Getting Started

1. **Install dependencies**
   ```
   npm install
   ```

2. **Start Metro Bundler**
   ```
   npm start -- --clear
   ```

3. **Run on your device or simulator**

   Follow Expo’s workflow for running the app as appropriate for your platform.

## Troubleshooting

- ENOENT or dependency errors:
  - Clear the npm cache: `npm cache clean --force`
  - Reinstall dependencies: `npm install`
  - Reboot Metro Bundler as described above.

- Permission or playback issues:
  - Ensure device permissions are granted (location, microphone).
  - Check for missing audio URLs or asset problems.

## Contributing

Pull requests and feedback are welcome! Please focus initial contributions on the core roadmap milestones or open feature requests.

## Roadmap

| Feature                                     | Status   |
|----------------------------------------------|----------|
| Map Echo Discovery & Audio Playback          | Complete |
| User Location Integration                    | Complete |
| Echo Recording & Upload                      | In progress |
| Echo Filtering/Searching                     | Planned  |
| Notification System                          | Planned  |
| Accessibility Improvements                   | Planned  |
| Testing (Unit/Integration/E2E)               | Ongoing  |

This project advances the idea of place-based, anonymous voice storytelling. Thank you for helping build a new way to experience and contribute to the soundscape of the world!
