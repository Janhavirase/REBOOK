# REBOOK
book reselling marketplace
# 📚 ReBook - Hyperlocal C2C Book Marketplace

![ReBook Banner](https://via.placeholder.com/1200x400?text=ReBook+Marketplace+Preview)
ReBook is a full-stack MERN application that connects book lovers within the same city. It utilizes geolocation to enable a "Hyperlocal" marketplace experience, allowing users to buy and sell used books with zero shipping costs by meeting locally.

🚀 **Live Demo:** [https://rebook-frontend.vercel.app](https://rebook-frontend.vercel.app)  
*(Note: Initial load may take ~50s as the backend spins up on the free tier)*

---

## ✨ Key Features

- **📍 Geolocation-Based Discovery:** Automatically detects user location to sort books by distance (e.g., "1.2 km away").
- **🔒 Secure Authentication:** JWT-based login with Protected Routes to secure Seller and Admin dashboards.
- **💬 Direct-to-Consumer Chat:** Integrated WhatsApp API for instant negotiation between buyers and sellers.
- **📊 Admin Dashboard:** Comprehensive analytics using Recharts to track inventory value, user growth, and categories.
- **🔍 Live Search:** Real-time search with debouncing for instant book filtering by title or author.
- **📱 Fully Responsive:** Optimized for Mobile, Tablet, and Desktop using Tailwind CSS.

---

## 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React.js (Vite), Tailwind CSS, Framer Motion, React Icons, Axios |
| **Backend** | Node.js, Express.js, JWT (JSON Web Tokens) |
| **Database** | MongoDB Atlas (Cloud) |
| **Deployment** | Vercel (Frontend), Render (Backend) |
| **Tools** | Git, Postman, Recharts, React-Toastify |

---

## 📸 Screenshots

| Home Page (Geolocation) | Book Details Page |
| :---: | :---: |
| ![Home](https://via.placeholder.com/400x250?text=Home+Page+Screenshot) | ![Details](https://via.placeholder.com/400x250?text=Book+Details+Screenshot) |

| Seller Dashboard | Admin Analytics |
| :---: | :---: |
| ![Sell](https://via.placeholder.com/400x250?text=Sell+Page+Screenshot) | ![Admin](https://via.placeholder.com/400x250?text=Admin+Dashboard+Screenshot) |

---

## 🚀 Getting Started (Run Locally)

If you want to run this project on your local machine, follow these steps:

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/REBOOK.git](https://github.com/your-username/REBOOK.git)
cd REBOOK
2. Backend Setup
Bash

cd backend
npm install
Create a .env file in the backend folder:

Code snippet

PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secret_key
Start the server:

Bash

npm start
3. Frontend Setup
Open a new terminal:

Bash

cd frontend
npm install
Create a .env file in the frontend folder:

Code snippet

VITE_API_URL=https://rebook-unyc.onrender.com
Start the React app:

Bash

npm run dev
🔒 Security Features implemented
Protected Routes: Higher-Order Component (HOC) wrapping sensitive routes like /sell and /admin.

JWT Verification: Backend middleware verifies token signature before allowing POST/PUT/DELETE requests.

Action-Level Gating: "Buy Now" and "Add to Cart" buttons check auth status before firing API calls.
