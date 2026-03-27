# Scratch Radio | Nuxt 4 Audio Player

A high-fidelity, single-station streaming application built with **Nuxt 4**, **Vue 3**, and **TailwindCSS**. This player is specifically optimized for a mobile-first experience, constrained to **iPhone 14 Pro** dimensions for a focused, app-like feel.

![Preview of app](./screenshot.png)

---

## Features

* **Nuxt 4 + Vue 3** - Optimized for the latest directory structure and performance
* **Mobile-First Design** - Layout locked to **iPhone 14 Pro** dimensions (393px x 852px)
* **iTunes Integration** - Metadata and album art lookups handled on the frontend via iTunes Search API
* **Advanced Waveform UI** - Custom SVG waveform with 45 dynamic bars, staggered animations, and progress masking
* **Icecast Streaming** - Real-time client-side audio streaming from `scratch-radio.ca`
* **Local Favorites** - Persistent "Like" system using local storage
* **Unsplash Fallback** - High-quality dynamic backgrounds when album art is unavailable

---

## Environment Variables

Create a `.env` file in the root directory and add your Unsplash Access Key for fallback background images

```env
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

## Installation

```bash
bun install
```

---

## Development

```bash
bun dev
```
---

## Build

```bash
bun build
```

## Preview

```bash
bun preview
```

## Start app

```bash
bun start
```

