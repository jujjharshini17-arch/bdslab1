# Backend Development Fundamentals – Lab 1: Node.js and Express Server

**Student Name:** J Harshini  
**Roll / Section:** 207 AI ML - 2B  
**Course:** B.Tech CSE (AI & ML), II Year  
**University:** Aurora Deemed to be University  
**Subject:** Backend Development Fundamentals – Lab 1  

---

## 🌐 Public Deployment & Repository Links

- **GitHub Repository:** [https://github.com/jujjharshini17-arch/bdslab1](https://github.com/jujjharshini17-arch/bdslab1)
- **Live Production URL (Render):** [https://bdslab1.onrender.com/](https://bdslab1.onrender.com/)

### 🚀 Verified Live Endpoints (Render):
| Endpoint | Method | Live URL | Expected Status | Response Format |
|---|---|---|---|---|
| **Root (Welcome)** | `GET` | [`https://bdslab1.onrender.com/`](https://bdslab1.onrender.com/) | `200 OK` | Plain text welcome message |
| **About (Student Info)** | `GET` | [`https://bdslab1.onrender.com/about`](https://bdslab1.onrender.com/about) | `200 OK` | JSON: `{ "name": "J Harshini", "section": "207 AI ML - 2B" }` |
| **Time (Dynamic Date)** | `GET` | [`https://bdslab1.onrender.com/time`](https://bdslab1.onrender.com/time) | `200 OK` | Plain text with current date & time |
| **Unknown (404 Error)** | `GET` | [`https://bdslab1.onrender.com/unknown`](https://bdslab1.onrender.com/unknown) | `404 Not Found` | Plain text 404 error message |

---

## 1. Project Overview

This project implements **Lab 1: Node.js and Express Server** as part of the Backend Development Fundamentals curriculum. It covers:
1. Creating a pure Node.js HTTP server using the built-in `http` module (`http-server.js`).
2. Creating an Express.js server with modular route handlers and status codes (`app.js` and `server.js`).
3. Handling `GET /`, `GET /about`, `GET /time`, and a catch-all `404 Not Found` route.
4. Deploying to **Render** using GitHub continuous deployment with dynamic port binding (`process.env.PORT || 3000`).
5. Testing and capturing real outputs from local and live production environments.

---

## 2. Project Directory Structure

```text
BDF-Lab-01/
│
├── package.json         # Project metadata, scripts, and dependencies
├── package-lock.json    # Exact versions of installed npm dependencies
├── node_modules/        # Directory containing installed Express library and dependencies
├── app.js               # Express application initialization and route definitions
├── server.js            # Entry point that launches the Express server (PORT || 3000)
├── http-server.js       # Pure Node.js HTTP server using built-in 'http' module
├── render.yaml          # Render blueprint specification for automated cloud deployment
├── .gitignore           # Ignores node_modules and OS-specific files from version control
├── README.md            # Comprehensive project documentation
└── screenshots/         # Actual terminal and browser output screenshots
    ├── terminal_setup.png
    ├── terminal_http_server.png
    ├── browser_http_server.png
    ├── terminal_express_server.png
    ├── route_root.png
    ├── route_about.png
    ├── route_time.png
    ├── route_404.png
    ├── render_live_terminal.png
    ├── render_live_root.png
    ├── render_live_about.png
    ├── render_live_time.png
    └── render_live_404.png
```

---

## 3. Prerequisites & Local Installation

### Prerequisites
- **Node.js** (v18 or higher installed on system)
- **npm** (Node Package Manager)

### Step 1: Open Terminal in Project Directory
Navigate to the `BDF-Lab-01` directory:
```bash
cd BDF-Lab-01
```

### Step 2: Initialize Node.js Project (Already Completed)
```bash
npm init -y
```

### Step 3: Install Express Framework
```bash
npm install express
```

---

## 4. Key Concepts Explained

### A. What is `package.json`?
`package.json` is the manifest file of any Node.js project. It contains:
- **`name`**: The name of the project (`bdf-lab-01`).
- **`version`**: The current semantic version (`1.0.0`).
- **`description`**: A summary of what the project does.
- **`main`**: The entry point file of the application (`server.js`).
- **`scripts`**: Command shortcuts (e.g., `npm start`, `npm run http-server`).
- **`dependencies`**: External libraries needed at runtime (e.g., `"express": "^5.3.0"`).
- **`type`**: Module system format (`"commonjs"` allows `require` and `module.exports`).

### B. What is `node_modules`?
`node_modules` is a folder created automatically by `npm install`. It contains all the downloaded code and libraries that your project depends on (e.g., Express and all its sub-dependencies). It is ignored in Git using `.gitignore` because it is large and can always be recreated using `npm install`.

### C. Request vs. Response
- **Request (`req`)**: An object containing all data sent by the client (browser), such as URL path, HTTP method (`GET`, `POST`), headers, and query parameters.
- **Response (`res`)**: An object provided by Node.js/Express used by the server to send data, HTTP status codes, and headers back to the client.

### D. What is a Route?
A **Route** maps an incoming HTTP method (like `GET`) and URL path (like `/about`) to a specific handler function that executes code and returns a response.

### E. What does `app.listen()` do?
`app.listen(port, callback)` binds the server to a specific TCP port (e.g., `process.env.PORT || 3000`) and begins listening for incoming client network connections. Once active, it invokes the optional callback function.

---

## 5. How to Run Locally

### Running the Pure Node.js HTTP Server:
```bash
npm run http-server
# OR
node http-server.js
```
Open browser at: [http://localhost:3000](http://localhost:3000)  
Response: `Hello`

### Running the Express Server:
```bash
npm start
# OR
node server.js
```
Open browser at: [http://localhost:3000](http://localhost:3000)

---

## 6. Endpoints Documentation

| HTTP Method | Route | Description | Status Code | Response Type / Format |
|---|---|---|---|---|
| **GET** | `/` | Returns welcome message | `200 OK` | Text (`Welcome to Backend Development Fundamentals - Lab 1 Express Server!`) |
| **GET** | `/about` | Returns student details | `200 OK` | JSON (`{ "name": "J Harshini", "section": "207 AI ML - 2B" }`) |
| **GET** | `/time` | Returns current date & time | `200 OK` | Text (`Current Date and Time: <current date string>`) |
| **ALL** | `/*` (Unknown) | Catch-all for unmatched routes | `404 Not Found` | Text (`404 Not Found: The requested URL was not found on this server.`) |

---

## 7. Cloud Deployment to Render

1. **GitHub Continuous Integration:** The repository is hosted at `https://github.com/jujjharshini17-arch/bdslab1`.
2. **Dynamic Port Allocation:** `server.js` uses `const PORT = process.env.PORT || 3000;`, enabling Render to inject its dynamic internal port without crashing.
3. **Build & Start Commands:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Live Verification:** Verified using cURL against `https://bdslab1.onrender.com` confirming zero downtime and proper Cloudflare reverse proxy routing.

---

## 8. Viva Questions & Quick Answers

1. **What is Node.js?**  
   *Answer:* Node.js is an open-source, cross-platform JavaScript runtime environment that executes JavaScript code outside a web browser, built on Google Chrome's V8 engine.

2. **What is Express.js?**  
   *Answer:* Express.js is a minimal, fast, and flexible web framework for Node.js that simplifies routing, middleware integration, and server configuration.

3. **Why do we use CommonJS `require()` and `module.exports`?**  
   *Answer:* CommonJS is Node.js's traditional module system. `require()` loads functions/objects from other files or packages, and `module.exports` exposes code from a file so other files can use it.

4. **Why separate `app.js` and `server.js`?**  
   *Answer:* Separation of concerns. `app.js` focuses on route and middleware logic, while `server.js` focuses on network/port binding. This also allows automated testing without starting a real network socket.

5. **What is the difference between `res.send()` and `res.json()`?**  
   *Answer:* `res.send()` can send text, HTML, or buffers with appropriate Content-Type. `res.json()` explicitly sets `Content-Type: application/json` and formats JavaScript objects into JSON strings.

6. **Why is `process.env.PORT || 3000` necessary for Render deployment?**  
   *Answer:* Cloud hosting platforms like Render dynamically assign a port number at runtime via the `PORT` environment variable. Using `process.env.PORT` ensures the application binds to the exact port Render's proxy expects, preventing deployment failure.
