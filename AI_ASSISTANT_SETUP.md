# AI Assistant Setup Guide (Optional)

WebXRide includes an optional AI-powered code assistant called "Ridey" that can help users improve their WebXR code, fix bugs, and learn best practices. **This feature is completely optional** - WebXRide works perfectly without it.

## Features

- **Code Analysis**: AI reviews your code and provides suggestions
- **Bug Detection**: Identifies potential issues and provides fixes
- **Performance Optimization**: Suggests improvements for better performance
- **Best Practices**: Recommends WebXR and A-Frame best practices
- **Interactive Learning**: Explains why changes are suggested

## Setup (Optional)

**Note**: You only need to follow these steps if you want to enable the AI Assistant feature. WebXRide works perfectly without it!

### 1. Get OpenAI API Key (Optional)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with letters like your-key-here)

### 2. Configure Environment Variables

Add your OpenAI API key to your `.env.development` file:

```bash
# OpenAI API Configuration
VITE_OPENAI_API_KEY=your-actual-openai-api-key-here
```

Optional tuning (defaults shown):

```bash
# Model selection (use one available to your key)
VITE_OPENAI_MODEL=gpt-4o-mini

# Sampling controls
VITE_OPENAI_TEMPERATURE=0.2   # lower = more deterministic for code
VITE_OPENAI_TOP_P=1

# Budget control
VITE_OPENAI_MAX_TOKENS=10000

# Optional: Customize Ridey's personality (appended to system prompt)
VITE_RIDEY_PERSONA="Style: brief, upbeat, coach-like. Always propose a minimal working fix first, then a short rationale."
```

### 3. Restart the Development Server

```bash
npm run dev
```

## Usage

### Enabling the AI Assistant (Admin Required)

**Important**: The AI Assistant must be enabled by an administrator before students can use it.

1. **Admin Access**: Log in with admin credentials
2. **Navigate to Admin Tools**: Click the admin panel
3. **Enable Ridey**: In "AI Assistant Settings", toggle "Enable Ridey AI Assistant" to ON
4. **Save**: The setting is automatically saved to localStorage

### Using the AI Assistant

1. Open any file in the code editor
2. Click the **"Ask Ridey"** button (purple button with sparkles icon) - only visible when enabled
3. The AI Assistant modal will open with Ridey (the WebXRide AI Assistant)

### Quick Actions

Ridey provides several quick actions with different AI "intentions":

- **Fix bugs and errors** - Identifies and fixes code issues (Low temperature for precision)
- **Optimize performance** - Suggests performance improvements (Medium temperature for balance)
- **Add new features** - Helps add new functionality (High temperature for creativity)
- **Improve code quality** - Enhances code readability and maintainability (Low temperature for consistency)

### Applying Suggestions

- **Cursor-Based Insertion**: AI suggestions are inserted at your cursor position, just like snippets
- **Smart Replacement Detection**: If the AI suggests a complete file replacement, you'll get a confirmation prompt
- **No Overwriting**: Your existing code is preserved - only additions/modifications are applied

### Custom Questions

You can also ask custom questions like:
- "How can I make this A-Frame scene load faster?"
- "What's the best way to handle user interactions in VR?"
- "How do I add physics to this 3D object?"
- "Why is my WebXR experience not working on mobile?"

## WebXR-Specific Features

Ridey is specifically tuned for WebXR development and understands:

- **A-Frame Framework** - Components, entities, and best practices
- **Three.js** - 3D graphics, materials, lighting, and optimization
- **WebXR APIs** - VR/AR interactions and device compatibility
- **Performance** - Frame rates, memory usage, and mobile optimization
- **Accessibility** - Making experiences inclusive for all users

## Privacy & Security

- Your code is sent to OpenAI's API for analysis
- No code is stored permanently by OpenAI
- API calls are made directly from your browser
- Consider this when working with sensitive code

## Troubleshooting

### Ridey Not Working

1. **Check API Key**: Ensure `VITE_OPENAI_API_KEY` is set correctly
2. **Check Network**: Verify you have internet connection
3. **Check Console**: Look for error messages in browser console
4. **Fallback Mode**: If API is unavailable, a basic fallback response will be shown

### Common Issues

- **"OpenAI API key not configured"** - Add your API key to `.env.development`
- **"Failed to get AI response"** - Check your API key and internet connection
- **"Invalid response format"** - This is usually temporary, try again

## Cost Considerations

- OpenAI API charges per token used
- Typical code analysis costs: $0.01 - $0.10 per request
- Monitor your usage in the OpenAI dashboard
- Consider setting usage limits for production

## Future Enhancements

Planned features:
- Code completion suggestions
- Real-time error detection
- Integration with A-Frame Inspector
- Custom AI models for WebXR
- Offline fallback responses

## Examples

### Example 1: Fixing A-Frame Code

**Input Code:**
```html
<a-scene>
  <a-box position="0 0 -5" color="red"></a-box>
</a-scene>
```

**AI Suggestion:**
```html
<a-scene>
  <a-box 
    position="0 0 -5" 
    color="red"
    shadow="cast: true; receive: true"
    animation="property: rotation; to: 0 360 0; loop: true; dur: 2000">
  </a-box>
  <a-light type="directional" position="0 1 0" cast-shadow></a-light>
</a-scene>
```

**Explanation:** Added shadow casting, rotation animation, and proper lighting for a more engaging 3D experience.

### Example 2: Performance Optimization

**AI can suggest:**
- Use `a-assets` for preloading
- Implement LOD (Level of Detail) for complex models
- Optimize texture sizes
- Use instancing for repeated objects
- Implement frustum culling

---

**Happy coding with AI assistance!**
