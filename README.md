# Chrome Regex Search

<img src="https://raw.githubusercontent.com/rogershen/chrome-regex-search/master/src/icons/icons_128.png" align="right" style="padding-left: 10px;" width="128" height="128" alt="Chrome Regex Search Icon">

A powerful Chrome extension that enhances your browsing experience with regular expression search capabilities, going beyond Chrome's built-in find functionality.

## Features

- 🔍 **Regex Search**: Find text using powerful regular expressions
- 🎨 **Customizable Highlights**: Choose your own highlight and selection colors
- ⚡ **Instant Search**: See results as you type (configurable)
- 📋 **Search History**: Keep track of your recent searches
- 🌓 **Dark/Light Mode**: Choose your preferred theme
- 📋 **Copy to Clipboard**: Copy all matches with a single click

## Installation

1. Install from Chrome Web Store:
   - chrome://extensions/
   - Enable developer mode
   - Click Load unpacked
   - In the file selection menu select the src folder 

## How to Use

1. Click the extension icon in your Chrome toolbar
2. Enter your regular expression in the search box
3. Navigate through matches using the arrow buttons or keyboard shortcuts
4. Use the settings icon (⚙️) to customize the extension's behavior

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Next match |
| `Shift + Enter` | Previous match |
| `Esc` | Close popup |

### Customizing Keyboard Shortcuts

1. Go to `chrome://extensions/shortcuts`
2. Find "Chrome Regex Search" in the list
3. Click the input field next to the action you want to change
4. Press your desired key combination
5. Click outside the input field to save

## Screenshots

### Search Interface
![Popup Interface](https://raw.githubusercontent.com/rogershen/chrome-regex-search/master/google-webstore/popup.png)

### Search Results
![Search Results](https://raw.githubusercontent.com/rogershen/chrome-regex-search/master/google-webstore/googlenews.png)
*Example: Finding four-letter words*

### Settings
![Settings](https://raw.githubusercontent.com/rogershen/chrome-regex-search/master/google-webstore/settings.png)
*Customize colors and behavior to your preference*

## Known Limitations

- Text in `<textarea>` and `<input>` elements cannot be highlighted due to browser security restrictions
- Some websites with complex DOM structures might have limited search capabilities
- Maximum number of results is limited to 500 by default (configurable in settings)

## Troubleshooting

If the extension isn't working as expected:

1. Ensure you're on a standard web page (not `chrome://` or extension pages)
2. Refresh the page and try again
3. Check the browser console for any error messages
4. Try disabling other extensions that might interfere

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

💡 **Tip**: Use `.*?` for non-greedy matching in your regular expressions!
Now whenever, you want to open the popup simply enter your custom command.
