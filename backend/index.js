require('dotenv').config();

const config = require('./config.json');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/user.model');
const TravelStory = require('./models/travelStory.model');
const { authenticateToken } = require('./utilities');
const upload = require('./multer');
const path = require('path');
const fs = require('fs');

mongoose.connect(config.connectionString)
.then(() => {
    console.log("MongoDB connected");

    app.listen(8000, () => {
        console.log("Server running on port 8000");
    });
})
.catch(err => {
    console.error("MongoDB connection failed:", err);
});

const app = express();
app.use(express.json());
app.use(cors({ origin:"*" }));

// Create Account
app.post("/login", async(req, res) => {
    const {email, password} = req.body;
    if(!email || !password) {
        return res.status(400).json({ 
            error: true, message: "All fields are required"
        });
    }

    const user = await User.findOne({ email });
    if(!user) {
        return res.status(400).json({ error: true, message: "Email not exists" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
        return res.status(400).json({ error: true, message: "Invalid Credentials" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
     
    res.status(200).json({ 
        error: false, user: { fullName: user.fullName, email: user.email }, message: "Login successful", accessToken
     });
});

// Login
app.post("/create-account", async(req, res) => {
    const {fullName, email, password} = req.body;
    if(!fullName || !email || !password) {
        return res.status(400).json({ 
            error: true, message: "All fields are required"
        });
    }

    const isUser = await User.findOne({ email });
    if(isUser) {
        return res.status(400).json({ error: true, message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
        fullName,
        email,
        password: hashedPassword
    });
    await user.save();

    const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "2d" });
    res.status(201).json({ 
        error: false, user: { fullName: user.fullName, email: user.email }, message: "Account created successfully", accessToken
     });

});

// Get User
app.get("/get-user", authenticateToken, async(req, res) => {
    const { id } = req.user;
    const user = await User.findOne({ _id: id });

    if(!user) {
        return res.status(401).json({ error: true, message: "User not found" });
    }

    return res.json({ error: false, user: { fullName: user.fullName, email: user.email } });
});

// Uploading Images
app.post("/image-upload", upload.single("image"), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: true, message: "No file uploaded" });
        }
        const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
        res.status(200).json({ error: false, imageUrl, message: "Image uploaded successfully" });
    } catch (error) {
        res.status(500).json({ error: true, message: "Internal Server Error: " + error.message });
    }
});

// Delete an Image from upload folder
app.delete("/delete-image", authenticateToken, async(req, res) => {
    const { imageUrl } = req.query;
    if (!imageUrl) {
        return res.status(400).json({ error: true, message: "Image URL is required" });
    }

    try {
        // Extract filename from Image URL
        const filename = path.basename(imageUrl);
        // Construct the full file path
        const filePath = path.join(__dirname, 'uploads', filename);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.status(200).json({ error: false, message: "Image deleted successfully" });
        } else {
            res.status(404).json({ error: true, message: "Image not found" });
        }
    } catch (error) {
        res.status(500).json({ error: true, message: "Internal Server Error: " + error.message });
    }
});

 // Serve static files from uploads and Assets directories
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Add Travel Story
app.post("/add-travel-story", authenticateToken, async(req, res) => {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;
    const { id } = req.user;

    if(!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    try {
        // Convert visitedDate from milliseconds to Date object
        const convertedVisitedDate = new Date(visitedDate);

        if (isNaN(convertedVisitedDate.getTime())) {
            return res.status(400).json({
                error: true,
                message: "Invalid visitedDate format"
            });
        }

        const travelStory = new TravelStory({
            title,
            story,
            visitedLocation,
            imageUrl,
            visitedDate: convertedVisitedDate,
            userId: id
        });

        await travelStory.save();
        res.status(201).json({ error: false, story: travelStory, message: "Travel story added successfully" });

    } catch (error) {
        res.status(400).json({ error: true, message: "Internal Server Error "+error.message });
    }
});

// Get Travel Stories
app.get("/get-all-stories", authenticateToken, async(req, res) => {
    const { id } = req.user;

    try {
        const travelStories = await TravelStory
        .find({ userId: id })
        .sort({ isFavorite: -1 });

        res.status(200).json({ error: false, stories: travelStories });

    } catch (error) {
        res.status(400).json({ error: true, message: "Internal Server Error unable to fetch travel stories: "+error.message });
    }
});

app.post("/edit-story/:id", authenticateToken, async(req, res) => {

    const storyId = req.params.id;
    const { id: userId } = req.user;

    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body;

    if(!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const parsedVisitedDate = new Date(parseInt(visitedDate));

    try {

        const travelStory = await TravelStory.findOne({
            _id: storyId,
            userId: userId
        });

        if (!travelStory) {
            return res.status(404).json({ error: true, message: "Travel story not found" });
        }

        travelStory.title = title;
        travelStory.story = story;
        travelStory.visitedLocation = visitedLocation;
        travelStory.imageUrl = imageUrl;
        travelStory.visitedDate = parsedVisitedDate;

        await travelStory.save();

        res.status(200).json({
            error:false,
            story:travelStory,
            message:"Travel story updated successfully"
        });

    } catch(error){
        res.status(500).json({
            error:true,
            message:"Internal Server Error: "+error.message
        });
    }
});

// Delete Travel Story
app.delete("/delete-story/:id", authenticateToken, async (req, res) => {

    const storyId = req.params.id;
    const { id: userId } = req.user;

    try {

        const travelStory = await TravelStory.findOne({
            _id: storyId,
            userId: userId
        });

        if (!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel story not found"
            });
        }

        await TravelStory.deleteOne({ _id: storyId });

        // Extract file name form imageUrl
        const imageUrl = travelStory.imageUrl;
        const filename = path.basename(imageUrl);

        // Define file path
        const filePath = path.join(__dirname, 'uploads', filename);

        // Delete the image file if it exists
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(200).json({
            error: false,
            message: "Travel story deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            error: true,
            message: "Internal Server Error: " + error.message
        });

    }
});

// Update Favorite Status
app.put("/update-is-favorite/:id", authenticateToken, async (req, res) => {

    const storyId = req.params.id;
    const { isFavorite } = req.body;
    const { id: userId } = req.user;

    if (isFavorite === undefined) {
        return res.status(400).json({
            error: true,
            message: "isFavorite field is required"
        });
    }

    try {

        const travelStory = await TravelStory.findOne({
            _id: storyId,
            userId: userId
        });

        if (!travelStory) {
            return res.status(404).json({
                error: true,
                message: "Travel story not found"
            });
        }

        travelStory.isFavorite = isFavorite;

        await travelStory.save();

        res.status(200).json({
            error: false,
            message: "Favorite status updated successfully",
            story: travelStory
        });

    } catch (error) {

        res.status(500).json({
            error: true,
            message: "Internal Server Error: " + error.message
        });

    }

});

// Search Travel Stories
app.get("/search-stories", authenticateToken, async (req, res) => {

    const { query } = req.query;
    const { id: userId } = req.user;

    if (!query) {
        return res.status(400).json({
            error: true,
            message: "Search query is required"
        });
    }

    try {

        const searchResults = await TravelStory.find({
            userId: userId,
            $or: [
                { title: { $regex: query, $options: "i" } },
                { story: { $regex: query, $options: "i" } },
                { visitedLocation: { $regex: query, $options: "i" } }
            ]
        }).sort({ isFavorite: -1 });

        res.status(200).json({
            error: false,
            stories: searchResults
        });

    } catch (error) {

        res.status(500).json({
            error: true,
            message: "Internal Server Error: " + error.message
        });

    }

});

// Filter Travel Stories by Date Range
app.get("/travel-stories/filter", authenticateToken, async (req, res) => {

    const { startDate, endDate } = req.query;
    const { id: userId } = req.user;

    if (!startDate || !endDate) {
        return res.status(400).json({
            error: true,
            message: "startDate and endDate are required"
        });
    }

    try {

        const start = new Date(parseInt(startDate));
        const end = new Date(parseInt(endDate));

        const stories = await TravelStory.find({
            userId: userId,
            visitedDate: {
                $gte: start,
                $lte: end
            }
        }).sort({ isFavorite: -1, visitedDate: -1 });

        res.status(200).json({
            error: false,
            stories
        });

    } catch (error) {

        res.status(500).json({
            error: true,
            message: "Internal Server Error: " + error.message
        });
    }
});

module.exports = app;