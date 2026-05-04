import { useState } from 'react';
import '../styles/Terminal.css';

const API_URL = 'http://localhost:3001/api';

interface TerminalProps {
  sshSessionId: string | null;
}

interface Command {
  command: string;
  stdout: string;
  stderr: string;
  timestamp: Date;
}

export function Terminal({ sshSessionId }: TerminalProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!sshSessionId || !input.trim()) return;

    const command = input;
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/ssh/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sshSessionId, command }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const result = await response.json();
      setCommands(prev => [...prev, {
        command,
        stdout: result.stdout,
        stderr: result.stderr,
        timestamp: new Date(),
      }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCommands([]);
    setError(null);
  };

  if (!sshSessionId) {
    return <div className="terminal">Connect to server to access terminal</div>;
  }

  return (
    <div className="terminal">
      <div className="terminal-header">
        <h3>SSH Terminal</h3>
        <button onClick={handleClear} className="clear-btn">Clear</button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="terminal-output">
        {commands.length === 0 ? (
          <div className="terminal-prompt">$ Ready</div>
        ) : (
          commands.map((cmd, idx) => (
            <div key={idx} className="command-block">
              <div className="command-input">$ {cmd.command}</div>
              {cmd.stdout && <div className="command-stdout">{cmd.stdout}</div>}
              {cmd.stderr && <div className="command-stderr">{cmd.stderr}</div>}
            </div>
          ))
        )}
      </div>

      <div className="terminal-input">
        <span className="prompt">$ </span>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleExecute()}
          placeholder="Enter command..."
          disabled={loading}
          autoFocus
        />
        <button onClick={handleExecute} disabled={loading}>
          {loading ? 'Executing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
}
