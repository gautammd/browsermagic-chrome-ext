# BrowserMagic UI Architecture

This document outlines the UI architecture for the BrowserMagic Chrome extension, which has been modernized using React and follows Apple-inspired design principles.

## Technology Stack

- **React 18**: Modern component-based UI framework
- **Framer Motion**: Animation library for smooth transitions
- **React Icons**: Icon library
- **CSS Variables**: For consistent theming and styling
- **Webpack**: For bundling and module management

## Project Structure

```
popup/
├── components/              # React components
│   ├── App.jsx              # Main application component
│   ├── Header.jsx           # Header component with navigation
│   ├── Footer.jsx           # Footer component
│   ├── PromptView.jsx       # Main prompt input view
│   ├── SettingsView.jsx     # Settings configuration view
│   └── settings/            # Settings-specific components
│       ├── ProviderSelector.jsx  # LLM provider selection
│       ├── GroqSettings.jsx      # Groq provider settings
│       ├── ClaudeSettings.jsx    # Claude provider settings
│       └── MockSettings.jsx      # Mock provider settings
├── styles/                  # CSS styles
│   └── index.css            # Main stylesheet with CSS variables
├── utils/                   # Utility functions
│   └── storage.js           # Chrome storage utilities
├── hooks/                   # Custom React hooks
├── popup.html               # Main HTML entry point
└── popup.jsx                # React entry point
```

## Design System

The UI follows Apple-inspired design principles:

### Colors

- **Primary**: #0071e3 (Apple blue)
- **Surface**: #ffffff (White)
- **Background**: #f5f5f7 (Light gray)
- **Text**: #1d1d1f (Near black), #6e6e73 (Medium gray), #86868b (Light gray)
- **Semantic**: Success (#34c759), Warning (#ff9500), Error (#ff3b30)

### Typography

- **Font Family**: Inter, -apple-system, BlinkMacSystemFont
- **Font Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Font Sizes**: 11px, 12px, 14px, 16px, 20px, 24px

### Spacing

- **XS**: 4px
- **SM**: 8px
- **MD**: 16px
- **LG**: 24px
- **XL**: 32px

### UI Elements

- **Button Variants**: Primary, Secondary, Ghost, Success, Danger
- **Input Fields**: Text inputs, password inputs, selects, range sliders
- **Cards**: Container elements with rounded corners and subtle shadows
- **Status Indicators**: Success, Error, Loading states

## Component Architecture

### App Component

The main container that manages:
- Current view state (prompt vs settings)
- Global settings state
- Chrome storage integration

### PromptView

Handles the main functionality:
- Natural language input
- Command execution
- Status feedback
- Connection to background script

### SettingsView

Manages provider configuration:
- Provider selection
- Provider-specific settings
- Connection testing
- Saving configuration to storage

### Settings Components

Individual components for each provider:
- **ProviderSelector**: Switches between available providers
- **GroqSettings**: Groq API configuration
- **ClaudeSettings**: Claude API configuration
- **MockSettings**: Development mode settings

## State Management

- **Local Component State**: For UI-specific states
- **Prop Drilling**: For passing data between components
- **Chrome Storage**: For persisting settings

## Animation System

Uses Framer Motion for:
- Page transitions
- Element enter/exit animations
- Status notification animations
- Button hover effects

## Responsive Design

- Fixed width of 350px (standard for Chrome extensions)
- Minimum height of 450px
- Scrollable content for overflow
- Touch-friendly controls

## Accessibility Features

- Semantic HTML elements
- ARIA attributes where needed
- Keyboard navigation support
- Sufficient color contrast
- Focus indicators

## Future Improvements

Potential enhancements:
- Theme switching (light/dark mode)
- Custom component library for consistent UI elements
- State management with Context API or Redux for larger scale
- Testing with React Testing Library
- Storybook for component documentation