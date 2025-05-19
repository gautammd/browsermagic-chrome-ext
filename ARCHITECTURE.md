# BrowserMagic.ai Architecture

## Overview

BrowserMagic is a Chrome extension built with a modern React architecture. It uses a sidebar design pattern for an improved user experience, combined with a component-based approach that promotes reusability and maintainability.

## Technology Stack

- **React 18**: For component-based UI development
- **Tailwind CSS**: For utility-based styling
- **Chrome Extension APIs**: For browser integration
- **Webpack**: For bundling and asset management

## Project Structure

```
browsermagic/
├── background/                 # Background service worker
├── content/                    # Content scripts
├── sidebar/                    # Sidebar UI (React)
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.jsx      
│   │   │   ├── Card.jsx        
│   │   │   ├── InputField.jsx  
│   │   │   └── ...             
│   │   ├── settings/           # Settings components
│   │   │   ├── ProviderSelector.jsx
│   │   │   ├── GroqSettings.jsx
│   │   │   └── ...             
│   │   ├── App.jsx             # Main App component
│   │   ├── PromptView.jsx      # Prompt input view
│   │   └── SettingsView.jsx    # Settings view
│   ├── hooks/                  # Custom React hooks
│   │   ├── useBackgroundMessaging.js
│   │   ├── usePromptHistory.js
│   │   └── useStorage.js
│   ├── styles/                 # CSS styles
│   │   └── tailwind.css        # Tailwind entry point
│   └── sidebar.jsx             # Sidebar entry point
├── services/                   # LLM service integrations
├── tailwind.config.js          # Tailwind configuration
├── postcss.config.js           # PostCSS configuration
├── webpack.config.js           # Webpack configuration
└── manifest.json               # Extension manifest
```

## Component Architecture

The UI is organized into a component hierarchy:

- **App**: Main container component managing state and view switching
  - **Header**: Displays the title and settings button
  - **PromptView**: Handles prompt input and execution
    - Manages prompt history 
    - Allows re-running previous prompts
  - **SettingsView**: Manages provider configuration
    - **ProviderSelector**: For choosing the LLM provider
    - **Provider settings**: Provider-specific settings components
  - **Footer**: Displays app metadata

## State Management

- **Local Component State**: Used for UI-specific states with `useState`
- **Component Props**: For passing data down the component tree
- **Chrome Storage API**: For persisting settings between sessions
- **Custom Hooks**: For encapsulating logic and state

## Custom Hooks

- **useStorage**: Manages data persistence to Chrome's storage
- **usePromptHistory**: Handles the prompt history feature
- **useBackgroundMessaging**: Manages communication with the background script

## Styling Approach

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Theming**: Extended Tailwind configuration for Apple-inspired design
- **Component Classes**: Defined in Tailwind CSS using `@layer components`

## Key Abstractions

1. **UI Components**: Reusable UI primitives
   - Button
   - InputField
   - TextareaField
   - SelectField
   - Card
   - StatusMessage

2. **Provider Settings**: Modular settings interfaces
   - Common fields abstracted into reusable components
   - Provider-specific logic encapsulated

3. **Messaging Layer**: Abstracted communication with background scripts
   - Error handling
   - Request/response management