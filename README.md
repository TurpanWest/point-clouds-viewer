# Point Cloud Viewer 3D 🌐
> **High-Performance Web-based LiDAR Point Cloud Visualization**

## 📖 Introduction (简介)
**Point Cloud Viewer** is a modern web application built for visualizing massive 3D point cloud datasets directly in the browser. Powered by **React Three Fiber** and optimized for performance, it allows users to interact with millions of points (e.g., KITTI datasets) smoothly.

It features advanced capabilities like **GPU-accelerated rendering**, **selection tools**, and **real-time performance monitoring**, making it an ideal tool for autonomous driving data inspection, 3D mapping, and computer vision research.

## ✨ Features (功能特性)
*   **Massive Dataset Support:** Efficiently loads and renders large PCD files (tested with 20M+ points).
*   **Interactive Selection:** Shift + Drag to select specific regions of points in 3D space.
*   **Performance Monitoring:** Built-in `r3f-monitor` to track FPS, memory usage, and GPU calls.
*   **Smooth Navigation:** Intuitive OrbitControls for zooming, panning, and rotating the view.
*   **Optimized Loading:** Smart loading strategies to prevent UI freezing during heavy data parsing.

## 🛠 Tech Stack (技术栈)
*   **Framework:** [Next.js](https://nextjs.org/) (React 19)
*   **3D Engine:** [Three.js](https://threejs.org/) & [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
*   **Helpers:** [@react-three/drei](https://github.com/pmndrs/drei)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS

## 🚀 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/TurpanWest/point-clouds-viewer.git
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Data Handling
This project uses **Git LFS** (Large File Storage) to manage large `.pcd` files. Ensure you have Git LFS installed if you plan to work with the raw data locally.

## 📄 License
MIT
