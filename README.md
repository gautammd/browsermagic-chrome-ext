# BrowserMagic.ai

A Chrome extension that uses natural language to automate browser actions with LLM integration.

## Overview

BrowserMagic.ai allows users to input natural language instructions that are interpreted and executed as browser actions. The extension can:

- Click on elements
- Fill out forms
- Navigate to URLs
- Extract page information
- Execute multi-step workflows

## Modern React UI

The extension's UI is built with React 18 and follows Apple-inspired design principles:

- Clean, minimal interface with focus on user experience
- Smooth animations and transitions
- Consistent design language
- Responsive and accessible components

See [UI-ARCHITECTURE.md](UI-ARCHITECTURE.md) for detailed documentation on the UI implementation.

## Project Structure

```
browsermagic.ai/
├── assets/                 # Icons and images
├── background/             # Background service worker
│   ├── background.js       # Main background script that handles orchestration
│   └── api.js              # API communication interface
├── content/                # Content scripts
│   └── content.js          # Executes commands in the active tab
├── popup/                  # Extension popup UI
│   ├── popup.html          # Popup interface
│   ├── popup.css           # Popup styles
│   └── popup.js            # Popup behavior
├── services/               # LLM service integrations
│   ├── base-service.js     # Base service implementation
│   ├── command-executor.js # Command execution logic
│   ├── dom-utils.js        # DOM utilities for element selection
│   ├── llm-service.js      # Base service interface
│   ├── llm-service-factory.js # Factory for creating services
│   ├── llm-service-manager.js # Service manager
│   ├── groq-service.js     # Groq API implementation
│   ├── claude-service.js   # Claude API implementation
│   ├── meta-service.js     # Meta API implementation
│   ├── mock-service.js     # Mock implementation for development
│   ├── prompt-templates.js # LLM prompt templates
│   ├── error-handler.js    # Error handling utilities
│   └── config.js           # Service configurations
├── webpack.config.js       # Webpack configuration
├── build.sh                # Build script
├── .gitignore              # Git ignore file
└── manifest.json           # Extension manifest
```

## LLM Service Architecture

The extension uses a flexible service-based architecture for integrating with LLM providers:

- **LLMService**: Base interface that all service implementations must follow
- **LLMServiceFactory**: Creates service instances based on provider name
- **LLMServiceManager**: Handles service configuration, caching, and operation

Current supported providers:
- **Groq**: Uses Groq's API with multiple model options:
  - LLaMA 3.3 (70B and 8B versions)
  - Mixtral 8x7B 32K
  - Meta LLaMA 4 Maverick 17B
- **Claude**: Uses Claude's API for advanced reasoning
  - Claude 3 models (Sonnet, Opus, Haiku)
- **Meta**: Uses Meta's API for LLaMA models
- **Mock**: Local implementation for development and testing

## Build System

BrowserMagic uses webpack to bundle its JavaScript modules:

- **Module bundling**: All JavaScript files are bundled with webpack
- **Development mode**: Run `npm run dev` for continuous building during development
- **Production build**: Run `npm run build` for production-ready extension

## Getting Started with LLM Providers

### Groq

1. Get an API key from [Groq's console](https://console.groq.com/)
2. Click the settings icon (⚙️) in the extension popup
3. Select "Groq" as the provider
4. Enter your API key
5. Select your desired model and temperature
6. Click "Save Settings"

### Claude

1. Get an API key from [Anthropic's console](https://console.anthropic.com/)
2. Click the settings icon (⚙️) in the extension popup
3. Select "Claude" as the provider
4. Enter your API key
5. Select your desired model and temperature
6. Click "Save Settings"

## Development

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. For active development, use `npm run dev` to watch for changes
5. Load the extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` directory

## Adding a New LLM Provider

To add a new LLM provider:

1. Create a new service implementation that extends `LLMService` or `BaseService`
2. Add the new service to `LLMServiceFactory`
3. Add provider-specific UI in the popup.html and popup.js files
4. Update the config.js with default settings
5. Implement provider-specific prompt handling in the new service class

## Example Usage

Example prompt:
```
Navigate to https://google.com, type 'hello world' into the search box, and click search.
```

This would execute:
1. Navigate to Google
2. Fill the search input with "hello world"
3. Click the search button

More complex example:
```
Go to twitter.com, log in with my credentials, find the latest tweet from OpenAI, and like it.
```

This multi-step workflow would:
1. Navigate to Twitter
2. Identify and fill the login form
3. Submit the form and wait for navigation
4. Search for OpenAI's account
5. Find the latest tweet
6. Click the like button

## Troubleshooting

If you encounter issues:

1. Check the browser console for error messages
2. Verify that your API keys are correctly entered
3. For content script issues, try reloading the extension
4. For bundling issues, check webpack output in the terminal

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT