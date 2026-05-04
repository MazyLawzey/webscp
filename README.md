# WebSCP - Web SSH/SFTP Client

A web-based SSH and SFTP client built with React, TypeScript, and Node.js. Connect to remote servers, execute commands, and manage files from your browser.

## Features

- 🔐 **SSH Terminal** - Execute commands on remote servers
- 📁 **SFTP File Manager** - Browse, upload, download, and delete files
- 🔑 **Authentication** - Support for both password and private key authentication
- 📊 **Real-time file operations** - Create folders, rename files, view permissions
- 💻 **Full terminal support** - Interactive SSH shell with command history

## Project Structure

```
webscp/
├── webscp/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── types/           # TypeScript types
│   │   ├── styles/          # Component styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
└── server/          # Backend (Express + SSH2)
    ├── src/
    │   ├── services/        # SSH and SFTP services
    │   └── index.ts         # Express server
    └── package.json
```

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

### Backend Setup

```bash
cd server
npm install
```

### Frontend Setup

```bash
cd webscp
npm install
```

## Configuration

### Backend Environment

Create `.env` file in the `server` directory (copy from `.env.example`):

```
PORT=3001
NODE_ENV=development
```

## Running the Application

### Start Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:3001`

### Start Frontend Dev Server

In another terminal:

```bash
cd webscp
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Endpoints

### SSH Operations

- `POST /api/ssh/connect` - Connect to SSH server
- `POST /api/ssh/exec` - Execute command
- `POST /api/ssh/disconnect` - Close SSH connection

### SFTP Operations

- `POST /api/sftp/connect` - Connect to SFTP server
- `POST /api/sftp/list` - List directory contents
- `POST /api/sftp/stat` - Get file/directory info
- `POST /api/sftp/read` - Read file contents
- `POST /api/sftp/write` - Write file contents
- `POST /api/sftp/delete` - Delete file or directory
- `POST /api/sftp/mkdir` - Create directory
- `POST /api/sftp/rename` - Rename file/directory
- `POST /api/sftp/disconnect` - Close SFTP connection

## Building for Production

### Backend

```bash
cd server
npm run build
npm run start
```

### Frontend

```bash
cd webscp
npm run build
```

## Security Notes

- Never expose sensitive credentials in the code
- Always use HTTPS in production
- Consider implementing authentication for the web interface
- Be cautious with key-based authentication - ensure private keys are handled securely
- Consider rate limiting and other security measures for production deployment

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Express, SSH2, TypeScript
- **Styling**: CSS3, Flexbox, Grid

## License

MIT
