import { useState } from 'react'
import { ConnectionForm } from './components/ConnectionForm'
import { FileManager } from './components/FileManager'
import { Terminal } from './components/Terminal'
import type { ConnectionConfig } from './types'
import './App.css'

const API_URL = 'http://localhost:3001/api'

function App() {
  const [sshSessionId, setSshSessionId] = useState<string | null>(null)
  const [sftpSessionId, setSftpSessionId] = useState<string | null>(null)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'terminal' | 'files'>('files')

  const handleConnect = async (config: ConnectionConfig) => {
    setConnectionLoading(true)
    setError(null)

    try {
      // Connect SSH
      const sshBody = {
        host: config.host,
        port: config.port,
        username: config.username,
      } as any

      if (config.usePrivateKey && config.privateKey) {
        sshBody.privateKey = config.privateKey
      } else if (!config.usePrivateKey && config.password) {
        sshBody.password = config.password
      }

      const sshResponse = await fetch(`${API_URL}/ssh/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sshBody),
      })

      if (!sshResponse.ok) {
        const data = await sshResponse.json()
        throw new Error(`SSH connection failed: ${data.error}`)
      }

      const sshData = await sshResponse.json()
      setSshSessionId(sshData.sessionId)

      // Connect SFTP
      const sftpBody = {
        host: config.host,
        port: config.port,
        username: config.username,
      } as any

      if (config.usePrivateKey && config.privateKey) {
        sftpBody.privateKey = config.privateKey
      } else if (!config.usePrivateKey && config.password) {
        sftpBody.password = config.password
      }

      const sftpResponse = await fetch(`${API_URL}/sftp/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sftpBody),
      })

      if (!sftpResponse.ok) {
        const data = await sftpResponse.json()
        throw new Error(`SFTP connection failed: ${data.error}`)
      }

      const sftpData = await sftpResponse.json()
      setSftpSessionId(sftpData.sessionId)
    } catch (err: any) {
      setError(err.message)
      setSshSessionId(null)
      setSftpSessionId(null)
    } finally {
      setConnectionLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (sshSessionId) {
        await fetch(`${API_URL}/ssh/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sshSessionId }),
        })
      }

      if (sftpSessionId) {
        await fetch(`${API_URL}/sftp/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: sftpSessionId }),
        })
      }

      setSshSessionId(null)
      setSftpSessionId(null)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="app">
      {!sshSessionId ? (
        <ConnectionForm onConnect={handleConnect} loading={connectionLoading} />
      ) : (
        <div className="app-container">
          <header className="app-header">
            <h1>🚀 WebSCP</h1>
            <button onClick={handleDisconnect} className="disconnect-btn">
              Disconnect
            </button>
          </header>

          {error && <div className="error-banner">{error}</div>}

          <div className="content-tabs">
            <div className="tabs">
              <button
                className={`tab ${activeTab === 'files' ? 'active' : ''}`}
                onClick={() => setActiveTab('files')}
              >
                📁 File Manager
              </button>
              <button
                className={`tab ${activeTab === 'terminal' ? 'active' : ''}`}
                onClick={() => setActiveTab('terminal')}
              >
                💻 Terminal
              </button>
            </div>

            <div className="tab-content">
              {activeTab === 'files' && <FileManager sftpSessionId={sftpSessionId} />}
              {activeTab === 'terminal' && <Terminal sshSessionId={sshSessionId} />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
