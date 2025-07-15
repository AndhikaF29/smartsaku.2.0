const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use('/Smartsaku', express.static(path.join(__dirname)));

// Redirect root to home page
app.get('/', (req, res) => {
    res.redirect('/SmartSaku/src/templates/home.html');
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});