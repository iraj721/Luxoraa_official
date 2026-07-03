# Luxoraa Official

A premium fashion & lifestyle e-commerce platform with a customer-facing storefront, admin dashboard, and REST API backend.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Features](#features)
  - [Customer App](#customer-app)
  - [Admin Panel](#admin-panel)
  - [Backend API](#backend-api)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Social Media Links](#social-media-links)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)
- [License](#license)

---

## Project Overview

Luxoraa Official is a full-stack e-commerce application built for a premium fashion brand. It includes:

- **Customer Frontend** – Browse categories, view products, and shop via external links
- **Admin Dashboard** – Manage categories, products, social links, and site settings
- **REST API** – Powers both frontend and admin with MongoDB as the database

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript |
| **Admin Panel** | HTML5, CSS3, Vanilla JavaScript |
| **Build Tool** | Vite |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | JWT (JSON Web Tokens) |
| **Styling** | Custom CSS with luxury gold/black theme |
| **Icons** | Font Awesome 6.4.0 |
| **Fonts** | Google Fonts (Playfair Display, Inter, Cormorant Garamond) |

---

## Folder Structure
luxoraa-official/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js               # JWT authentication middleware
│   ├── models/
│   │   ├── Category.js           # Category schema
│   │   ├── Product.js            # Product schema
│   │   └── Social.js             # Social media links schema
│   ├── routes/
│   │   ├── admin.js              # Admin protected routes
│   │   └── public.js             # Public API routes (no auth)
│   ├── uploads/                  # Uploaded images storage
│   ├── .env                      # Environment variables
│   ├── package-lock.json
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── frontend/
│   ├── css/
│   │   ├── admin.css             # Admin panel styles
│   │   └── style.css             # Main customer styles (luxury theme)
│   ├── images/
│   │   ├── favicon.ico           # Site favicon
│   │   └── logo.jpg              # Brand logo
│   ├── js/
│   │   └── app.js                # Main JavaScript (API calls, rendering)
│   ├── .env                      # Frontend environment variables
│   ├── about.html                # About us page
│   ├── admin.html                # Admin dashboard panel
│   ├── categories.html           # All categories page
│   ├── index.html                # Home page
│   ├── package-lock.json
│   ├── package.json
│   ├── products.html             # All products + category filter
│   └── vite.config.js            # Vite configuration
│
├── .gitignore
├── package-lock.json
├── package.json
└── README.md
plain

---

## Features

### Customer App

- **Hero Section** – Animated welcome with brand logo and call-to-action buttons
- **Category Grid** – 3-column responsive grid showcasing product categories (max 9 on home)
- **Recent Products** – Latest product arrivals with quick-view modal
- **Product Detail Modal** – Image gallery, description, and direct buy link
- **Social Media Links** – Dynamic social icons from admin panel
- **Responsive Design** – Mobile-first, works on all screen sizes
- **Smooth Animations** – Scroll-triggered fade-in effects

### Admin Panel

- **Secure Login** – JWT-based authentication
- **Dashboard** – Overview with stats and quick actions
- **Category Management** – Add, edit, delete categories with image upload
- **Product Management** – Add, edit, delete products with multiple images
- **Social Links** – Manage Instagram, Pinterest, and other platforms
- **Site Settings** – Update site name, logo, favicon
- **Dark/Light Theme** – Toggle between themes
- **Mobile Responsive** – Works on all devices

### Backend API

- **Public Routes** – No authentication required for customer data
- **Protected Routes** – Admin-only access for mutations
- **Image Upload** – Multer for handling file uploads
- **MongoDB** – NoSQL database with Mongoose schemas
- **JWT Auth** – Secure token-based authentication
- **CORS Enabled** – Cross-origin requests supported

---

## Installation

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/luxoraa-official.git
cd luxoraa-official
Step 2: Install Backend Dependencies
bash
cd backend
npm install
Step 3: Configure Backend Environment Variables
Create a .env file in the backend/ folder:
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/luxoraa
JWT_SECRET=your_super_secret_key_here
NODE_ENV=development
Step 4: Start the Backend Server
bash
npm start
# or for development with nodemon
npm run dev
Server will run on http://localhost:5000
Step 5: Install Frontend Dependencies
bash
cd ../frontend
npm install
Step 6: Configure Frontend Environment
Create a .env file in the frontend/ folder if needed for API URL configuration.
Step 7: Start the Frontend (Vite)
bash
npm run dev
Frontend will run on http://localhost:5173 (default Vite port)
Step 8: Access the Application
Table
URL	Description
http://localhost:5173	Customer Frontend
http://localhost:5173/admin.html	Admin Dashboard
http://localhost:5000/api	API Base URL
Environment Variables
Backend (backend/.env)
Table
Variable	Description	Default
PORT	Server port	5000
MONGODB_URI	MongoDB connection string	Required
JWT_SECRET	Secret key for JWT tokens	Required
NODE_ENV	Environment mode	development
Frontend (frontend/.env)
Table
Variable	Description	Default
VITE_API_URL	Backend API URL	http://localhost:5000/api
API Endpoints
Public Routes (No Auth)
Table
Method	Endpoint	Description
GET	/api/public/categories	Get all categories
GET	/api/public/products	Get all products
GET	/api/public/social	Get social media links
GET	/api/public/settings	Get site settings
Auth Routes
Table
Method	Endpoint	Description
POST	/api/auth/login	Admin login
POST	/api/auth/logout	Admin logout
GET	/api/auth/me	Get current admin
Protected Routes (Admin Only)
Table
Method	Endpoint	Description
POST	/api/categories	Create category
PUT	/api/categories/:id	Update category
DELETE	/api/categories/:id	Delete category
POST	/api/products	Create product
PUT	/api/products/:id	Update product
DELETE	/api/products/:id	Delete product
POST	/api/social	Create social link
PUT	/api/social/:id	Update social link
DELETE	/api/social/:id	Delete social link
PUT	/api/settings	Update site settings
Social Media Links
Default social media accounts for Luxoraa Official:
Table
Platform	URL	Icon Class
Instagram	https://www.instagram.com/luxoraa_official/	fab fa-instagram
Pinterest	https://www.pinterest.com/luxoraa_official/	fab fa-pinterest
Add more platforms via the admin panel using Font Awesome icon classes:
Facebook: fab fa-facebook-f
TikTok: fab fa-tiktok
Twitter/X: fab fa-x-twitter
YouTube: fab fa-youtube
Customization
Changing Brand Colors
Edit CSS variables in frontend/css/style.css:
css
:root {
  --gold: #d4af37;        /* Primary accent */
  --gold-light: #f0d878;  /* Hover states */
  --gold-dark: #b8941f;   /* Darker accent */
  --black: #0a0a0a;       /* Background */
  --black-light: #141414; /* Card backgrounds */
  --cream: #f5f0e8;       /* Text color */
}
Adding New Social Platforms
Go to Admin Panel → Social Links
Click Add Social Link
Enter:
Name: Platform name (e.g., "Instagram")
URL: Full profile URL
Icon Class: Font Awesome class (e.g., fab fa-instagram)
Save changes
Troubleshooting
Table
Issue	Solution
Images not loading	Check uploads/ folder permissions
API not connecting	Verify API_URL in app.js matches backend port
CORS errors	Ensure backend CORS allows frontend origin
JWT expired	Re-login to admin panel
MongoDB connection fail	Check MONGODB_URI in backend/.env
Vite port conflict	Change port in vite.config.js
Future Enhancements
[ ] Shopping cart functionality
[ ] Payment gateway integration
[ ] Product search & filters
[ ] Customer reviews & ratings
[ ] Order management system
[ ] Email notifications
[ ] Multi-language support
[ ] SEO optimization
[ ] Dark mode toggle for customer site
License
This project is proprietary software for Luxoraa Official.
© 2026 Luxoraa Official. All rights reserved.
Contact
For support or inquiries, reach out via:
Instagram: @luxoraa_official
Pinterest: luxoraa_official
Built with ❤️ for premium fashion lovers.
